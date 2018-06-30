
/* ------------------------------------------- */
/* Character Object Type                       */
/* ------------------------------------------- */

class FTCCharacter extends FTCObject {

    constructor(obj, app, scope) {
        super(obj, app, scope)

        // Primary Templates
        this.templates = {
            FTC_SHEET_FULL: FTC.TEMPLATE_DIR + 'charsheet.html',
            FTC_SHEET_PRIVATE: FTC.TEMPLATE_DIR + 'privatesheet.html',
            FTC_SKILL_HTML: FTC.TEMPLATE_DIR + 'skill.html',
            FTC_ATTRIBUTE_HTML: FTC.TEMPLATE_DIR + 'attribute.html',
            FTC_ITEM_HTML: FTC.TEMPLATE_DIR + 'item.html',
            FTC_SPELL_LEVEL: FTC.TEMPLATE_DIR + 'spellheader.html',
            FTC_SPELL_HTML: FTC.TEMPLATE_DIR + 'spell.html',
            CHARACTER_TAB_TRAITS: FTC.TEMPLATE_DIR + 'characters/tab-traits.html',
            CHARACTER_PRIMARY_STATS: FTC.TEMPLATE_DIR + 'characters/primary-stats.html',
            CHARACTER_ABILITY: FTC.TEMPLATE_DIR + 'characters/character-ability.html'
        }

        // Register local for debugging
        FTC.character = this;
    }

    /* ------------------------------------------- */

    refineScope(scope) {
        scope.isPrivate = (scope.viewOnly && (this.obj._lid !== undefined));
        return scope;
    }

    /* ------------------------------------------- */

    enrichData(data) {

        // Temporary FTC display data
        const ftc = {};
        data.ftc = ftc;

        // Level and Experience
        const lvl = parseInt(data.counters.level.current);
        ftc['exp'] = {
            current: data.counters.exp.current.toLocaleString(),
            next: FTC.actions.get_next_level_exp(lvl).toLocaleString()
        };

        // Proficiency Bonus
        data.counters.proficiency.current = Math.floor((lvl + 7) / 4);

        // Enrich Attributes
        $.each(data.stats, function(attr, stat) {
            ftc[attr] = {
                'mod': stat.modifiers.mod,
                'svmod': (stat.proficient * data.counters.proficiency.current) + stat.modifiers.mod,
                'padstr': FTC.ui.padNumber(stat.current, 2),
                'modstr': (stat.modifiers.mod < 0 ? "" : "+" ) + stat.modifiers.mod
            }
        });

        // Spellcasting DC
        let spellAttr = data.info.spellcasting.current,
            mod = spellAttr ? data.ftc[spellAttr].mod : undefined;
        ftc["spellMod"] = mod;
        ftc["spellDC"] = mod ? 8 + mod + data.counters.proficiency.current : undefined;
        ftc["spellDCstr"] = mod ? "Spell DC " + data.ftc["spellDC"] : "";

        // Enrich Skills
        $.each(data.skills, function(name, skill) {
            let stat = data.ftc[skill.stat],
                 mod = ((skill.current || 0) * data.counters.proficiency.current) + stat.mod;
            ftc[name] = {
                'mod': mod,
                'modstr': (mod < 0 ? "" : "+" ) + mod
            }
        });

        // Base Armor Class
        data.ftc["baseAC"] = 10 + data.ftc["Dex"].mod;

        // Set up owned items
        this.setupInventory(data);
        this.setupSpellbook(data);
        this.setupAbilities(data);

        // Return the enriched data
        return data
    }

    /* ------------------------------------------- */

    setupInventory(data) {
        // Set up inventory items by converting them to FTCItem objects

        const ftc = data.ftc,
            weight = [];

        // Create inventory object
        ftc.inventory = {"items": []};

        // Iterate over inventory items
        $.each(data.inventory, function(itemId, itemData) {
            let item = new FTCItem(itemData, self.app, {"owner": this.owner, "container": "inventory"});
            ftc.inventory.items[itemId] = item;
            weight.push(item.info.weight.current);
        });

        // Compute weight and encumbrance
        let wt = (weight.length > 0) ? weight.reduce(function(total, num) { return total + (num || 0); }) : 0,
           enc = data.stats.Str.current * 15,
           pct = Math.min(wt * 100 / enc, 99.5),
           cls = (pct > 90 ) ? "heavy" : "";
        ftc.inventory["weight"] = {"weight": wt, "encumbrance": enc, "encpct": pct, "enccls": cls};
    }

    /* ------------------------------------------- */

    setupSpellbook(data) {
        // Set up spellbook items by converting them to FTCItem objects

        const ftc = data.ftc,
            sls = {};

        // Iterate over spellbook spells
        $.each(data.spellbook, function(spellId, itemData) {

            // Construct the item object
            let item = new FTCItem(itemData, self.app, {"owner": this.owner, "container": "spellbook"}),
                spell = item.spell;

            // Construct spell data
            let lvl = (spell.level.current === "Cantrip") ? 0 : parseInt(spell.level.current || 0);
            item.spellid = spellId;

            // Record spell-level
            sls[lvl] = sls[lvl] || {
                "level": lvl,
                "name": (lvl === 0) ? "Cantrip" : FTC.ui.getOrdinalNumber(lvl) + " Level",
                "current": FTC.getProperty(data, 'counters.spell'+lvl+'.current') || 0,
                "max": FTC.getProperty(data, 'counters.spell'+lvl+'.max') || 0,
                "spells": [],
            };
            sls[lvl].current = (lvl === 0) ? "&infin;" : sls[lvl].current;
            sls[lvl].max = (lvl === 0) ? "&infin;" : sls[lvl].max;
            sls[lvl].spells.push(item);
        });
        ftc['spellbook'] = sls;
    }

    /* ------------------------------------------- */

    setupAbilities(data) {
        // Set up ability items by converting them to FTCItem objects

        const ftc = data.ftc;
        ftc["abilities"] = [];
        $.each(data.abilities, function(itemId, itemData) {
            let item = new FTCItem(itemData, self.app, {"owner": this.owner, "container": "abilities"});
            ftc.abilities.push(item);
        });
    }

    /* ------------------------------------------- */

    buildHTML(data) {

        // Load primary template
        let template = this.scope.isPrivate ? this.templates.FTC_SHEET_PRIVATE : this.templates.FTC_SHEET_FULL,
            main = FTC.loadTemplate(template);

        // Augment sub-components
        if (!this.scope.isPrivate) {

            // Primary Stats
            main = FTC.injectTemplate(main, "CHARACTER_PRIMARY_STATS", this.templates.CHARACTER_PRIMARY_STATS)

            // Attributes
            let attrs = "";
            let template = FTC.loadTemplate(this.templates.FTC_ATTRIBUTE_HTML);
            for ( var s in data.stats ) {
                attrs += template.replace(/\{stat\}/g, s);
            }
            main = main.replace("<!-- FTC_ATTRIBUTE_HTML -->", attrs);

            // Insert Skills
            let skills = "";
            template = FTC.loadTemplate(this.templates.FTC_SKILL_HTML)
            for (var s in data.skills) {
                skills += template.replace(/\{skl\}/g, s);
            }
            main = main.replace("<!-- FTC_SKILL_HTML -->", skills);

            // Insert Inventory
            let items = "";
            template = FTC.loadTemplate(this.templates.FTC_ITEM_HTML);
            $.each(data.ftc.inventory.items, function(i, item) {
                item.itemid = i;
                items += FTC.populateTemplate(template, item);
            });
            items = items || '<li><blockquote class="compendium">Add items from the compendium.</blockquote></li>';
            main = main.replace("<!-- FTC_INVENTORY_HTML -->", items);

            // Insert Spells
            let spells = "",
                ltmp = FTC.loadTemplate(this.templates.FTC_SPELL_LEVEL),
                stmp = FTC.loadTemplate(this.templates.FTC_SPELL_HTML);
            $.each(data.ftc.spellbook, function(l, s){
                spells += FTC.populateTemplate(ltmp, s);
                $.each(s.spells, function(i, p){
                    spells += FTC.populateTemplate(stmp, p);
                });
            });
            spells = spells || '<li><blockquote class="compendium">Add spells from the compendium.</blockquote></li>';
            main = main.replace("<!-- FTC_SPELLS_HTML -->", spells);

            // Abilities
            let abilities = "";
            template = FTC.loadTemplate(this.templates.CHARACTER_ABILITY);
            $.each(data.ftc.abilities, function(i, item) {
                item.itemid = i;
                abilities += FTC.populateTemplate(template, item);
            });
            abilities = abilities || '<li><blockquote class="compendium">Add abilities from the compendium.</blockquote></li>';
            main = main.replace("<!-- CHARACTER_TAB_ABILITIES -->", abilities);

            // Character Traits
            main = FTC.injectTemplate(main, "CHARACTER_TAB_TRAITS", this.templates.CHARACTER_TAB_TRAITS)
        }
        return main;
    }

    /* ------------------------------------------- */

    activateEventListeners(html) {
        FTC.ui.activate_tabs(html, this.obj, this.app);
        FTC.forms.activateFields(html, this, this.app);
        FTC.actions.activateActions(html, this.obj, this.app);
    }

    /* ------------------------------------------- */

    updateItem(container, itemId, item) {
        console.log(item);
        this.data[container][itemId] = item;
        this.changed = true;
        this.save();
    }

    /* ------------------------------------------- */

    deleteItem(container, itemId) {
        this.data[container].splice(itemId, 1);
        this.changed = true;
        this.save();
    }
}


/* -------------------------------------------- */
/* Character Sheet Sync Render                  */
/* -------------------------------------------- */

sync.render("FTC_CHARSHEET", function (obj, app, scope) {
    if ( game.templates.identifier !== FTC_SYSTEM_IDENTIFIER ) {
        return $("<div>Sorry, no preview available at the moment.</div>");
    }
    const char = new FTCCharacter(obj, app, scope);
    return char.renderHTML();
});

