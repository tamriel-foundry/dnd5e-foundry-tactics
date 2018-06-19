
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
            FTC_SPELL_HTML: FTC.TEMPLATE_DIR + 'spell.html'
        }
    }

    /* ------------------------------------------- */

    refineScope(scope) {

        // Toggle template based on visibility scope
        this.isPrivate = (scope.viewOnly && (this.obj._lid !== undefined));
        return scope;
    }

    /* ------------------------------------------- */

    static enrichData(data) {

        // Temporary FTC display data
        data.ftc = data.ftc || {};

        // Level and Experience
        const lvl = parseInt(data.counters.level.current);
        data.ftc['exp'] = {
            current: data.counters.exp.current.toLocaleString(),
            next: FTC.actions.get_next_level_exp(lvl).toLocaleString()
        };

        // Proficiency Bonus
        data.counters.proficiency.current = Math.floor((lvl + 7) / 4);

        // Enrich Attributes
        $.each(data.stats, function(attr, stat) {
            data.ftc[attr] = {
                'padstr': FTC.ui.padNumber(stat.current, 2),
                'modstr': (stat.mod < 0 ? "" : "+" ) + stat.mod
            }
        });

        // Enrich Skills
        $.each(data.skills, function(name, skill) {
            let stat = data.stats[skill.stat],
                 mod = (skill.proficient * data.counters.proficiency.current) + stat.mod;
            data.ftc[name] = {
                'mod': mod,
                'modstr': (mod < 0 ? "" : "+" ) + mod
            }
        });

        // Enrich Inventory Items
        const weight = [];
        $.each(data.inventory, function(itemId, item) {
            item = FTCItem.enrichData(item);
            data.inventory[itemId] = item;
            weight.push(item.info.weight.current);
        });

        // Compute Weight and Encumbrance
        var wt = (weight.length > 0) ? weight.reduce(function(total, num) { return total + (num || 0); }) : 0,
           enc = data.stats.Str.current * 15,
           pct = Math.min(wt * 100 / enc, 99.5),
           cls = (pct > 90 ) ? "heavy" : "";
        data.ftc['inventory'] = {weight: wt, encumbrance: enc, encpct: pct, enccls: cls};

        // Spell Levels
        const spellLevels = {};
        $.each(data.spellbook, function(spellId, item) {

            // Store spell ID
            item.spellid = spellId;

            // Construct spell data
            let spell = item.spell;
            let lvl = (spell.level.current === "Cantrip") ? 0 : parseInt(spell.level.current || 0);
            let sl = obj.data.counters["spell"+lvl] || {
                "name": (lvl === 0) ? "Cantrip" : FTC.ui.getOrdinalNumber(lvl) + " Level",
                "current": 0,
                "max": 0,
            };

            // Tweak Spell-level data
            sl.spells = [];
            sl.current = (lvl === 0) ? "&infin;" : sl.current;
            sl.max = (lvl === 0) ? "&infin;" : sl.max;
            sl.level = lvl;

            // Associate the spell with it's spell level
            spellLevels[lvl] = spellLevels[lvl] || sl;
            spellLevels[lvl].spells.push(item);
        });
        data.ftc['spellLevels'] = spellLevels;

        // Return the data
        return data
    }

    /* ------------------------------------------- */

    buildHTML() {

        // Load primary template
        let template = this.isPrivate ? this.templates.FTC_SHEET_PRIVATE : this.templates.FTC_SHEET_FULL,
            main = FTC.template.load(template),
            obj = this.obj;

        // Augment sub-components
        if (!this.isPrivate) {

            // Attributes
            let attrs = "";
            let template = FTC.template.load(this.templates.FTC_ATTRIBUTE_HTML);
            for ( var s in obj.data.stats ) {
                attrs += template.replace(/\{stat\}/g, s);
            }
            main = main.replace("<!-- FTC_ATTRIBUTE_HTML -->", attrs);

            // Insert Skills
            let skills = "";
            template = FTC.template.load(this.templates.FTC_SKILL_HTML)
            for (var s in obj.data.skills) {
                skills += template.replace(/\{skl\}/g, s);
            }
            main = main.replace("<!-- FTC_SKILL_HTML -->", skills);

            // Insert Inventory
            let items = "";
            template = FTC.template.load(this.templates.FTC_ITEM_HTML);
            $.each(obj.data.inventory, function(i, item) {
                item.itemid = i;
                items += FTC.template.populate(template, item);
            });
            items = (items === "") ? "<li><blockquote>Add items from the compendium.</blockquote></li>" : items;
            main = main.replace("<!-- FTC_INVENTORY_HTML -->", items);

            // Insert Spells
            let spells = "",
                ltmp = FTC.template.load(this.templates.FTC_SPELL_LEVEL),
                stmp = FTC.template.load(this.templates.FTC_SPELL_HTML);
            $.each(obj.data.ftc.spellLevels, function(l, s){
                spells += FTC.template.populate(ltmp, s);
                $.each(s.spells, function(i, p){
                    spells += FTC.template.populate(stmp, p);
                });
            });
            spells = (spells === "") ? "<li><blockquote>Add spells from the compendium.</blockquote></li>" : spells;
            main = main.replace("<!-- FTC_SPELLS_HTML -->", spells);
        }
        return main;
    }
}


/* -------------------------------------------- */
/* Character Sheet Sync Render                  */
/* -------------------------------------------- */

sync.render("FTC_CHARSHEET", function(obj, app, scope) {
    const char = new FTCCharacter(obj, app, scope);
    return char.renderHTML();
});
