hook.add("FTCInit", "Character", function() {
FTC.character = {

    FTC_SHEET_FULL: FTC.TEMPLATE_DIR + 'charsheet.html',
    FTC_SHEET_PRIVATE: FTC.TEMPLATE_DIR + 'privatesheet.html',
    FTC_SKILL_HTML: FTC.TEMPLATE_DIR + 'skill.html',
    FTC_ATTRIBUTE_HTML: FTC.TEMPLATE_DIR + 'attribute.html',
    FTC_ITEM_HTML: FTC.TEMPLATE_DIR + 'item.html',
    FTC_SPELL_LEVEL: FTC.TEMPLATE_DIR + 'spellheader.html',
    FTC_SPELL_HTML: FTC.TEMPLATE_DIR + 'spell.html',

    /* ------------------------------------------- */

    enrichCharacter: function(obj) {
        /* Enrich character object with additional data */

        // Ensure we have an object to work with and that we can register custom FTC data
        obj = obj || sync.obj("ftc");
        obj.data.ftc = obj.data.ftc || {};
        ftc = obj.data.ftc;

        /* Level and Experience */
        var lvl = obj.data.counters.level.current;
        ftc['exp'] = {
            current: obj.data.counters.exp.current.toLocaleString(),
            next: FTC.actions.get_next_level_exp(lvl).toLocaleString()
        }

        // Proficiency Bonus
        obj.data.counters.proficiency.current = Math.floor((lvl + 7) / 4);

        // Enrich Attributes
        stats = obj.data.stats;
        for (var attr in stats) {
            mod = stats[attr].mod;
            ftc[attr] = {
                'modstr': (mod < 0 ? "" : "+" ) + mod
            }
        }

        // Enrich Skills
        skills = obj.data.skills;
        $.each(skills, function(name, skill) {
            var stat = obj.data.stats[skill.stat],
                 mod = (skill.proficient * obj.data.counters.proficiency.current) + stat.mod;
            ftc[name] = {
                'mod': mod,
                'modstr': (mod < 0 ? "" : "+" ) + mod
            }
        }),

        // Enrich Inventory Items
        weight = []
        for (var i in obj.data.inventory) {
            item = FTC.items.enrichItem(obj.data.inventory[i], i);
            obj.data.inventory[i] = item;
            weight.push(item.info.weight.current);
        }

        // Compute Weight and Encumbrance
        var wt = (weight.length > 0) ? weight.reduce(function(total, num) { return total + (num || 0); }) : 0,
           enc = obj.data.stats.Str.current * 15,
           pct = Math.min(wt * 100 / enc, 99.5),
           cls = (pct > 90 ) ? "heavy" : "";
        ftc['inventory'] = {weight: wt, encumbrance: enc, encpct: pct, enccls: cls};

        // Spell Levels
        spellLevels = {}
        for (i in obj.data.spellbook) {
            var  item = obj.data.spellbook[i],
                spell = item.spell;
                  lvl = (spell.level.current === "Cantrip") ? 0 : parseInt(spell.level.current[0]);
            item.spellid = i;
            spellLevel = {
                level: lvl,
                levelstr: (lvl === 0) ? "Cantrip" : FTC.ui.getOrdinalNumber(lvl) + " Level",
                perday: (lvl === 0) ? "&infin;" : obj.data.counters["spell"+lvl].max || 0,
                uses: (lvl === 0) ? "&infin;" : obj.data.counters["spell"+lvl].current || 0,
                spells: []
            }
            spellLevels[lvl] = spellLevels[lvl] || spellLevel;
            spellLevels[lvl].spells.push(item);
        }
        ftc['spellLevels'] = spellLevels;

        // Return the object
        FTC.obj = obj;
        return obj
    },


    /* ------------------------------------------- */

    renderCharsheetHTML: function(obj, scope) {
        /* Render Character Sheet HTML Template */

        // Toggle template based on visibility scope
        var isPrivate = (scope.viewOnly && (obj._lid !== undefined)),
            template = isPrivate ? this.FTC_SHEET_PRIVATE : this.FTC_SHEET_FULL;

        // Load primary template
        var temp = FTC.template,
            load = temp.loadTemplate,
            parse = temp.populateTemplate,
            main = load(template);

        // Augment Template
        if (!scope.viewOnly) {

            /* Insert Attributes */
            var attrs = "",
             template = load(this.FTC_ATTRIBUTE_HTML);
            for (var s in obj.data.stats) {
                attrs += template.replace(/\{stat\}/g, s);
            }
            main = main.replace("<!-- FTC_ATTRIBUTE_HTML -->", attrs);

            /* Insert Skills */
            var skills = "",
              template = load(this.FTC_SKILL_HTML)
            for (var s in obj.data.skills) {
                skills += template.replace(/\{skl\}/g, s);
            }
            main = main.replace("<!-- FTC_SKILL_HTML -->", skills);

            /* Insert Inventory */
            var items = "",
             template = load(this.FTC_ITEM_HTML);
            for (var i in obj.data.inventory) {
                item = FTC.items.enrichItem(obj.data.inventory[i], i);
                items += parse(template, item);
            }
            main = main.replace("<!-- FTC_INVENTORY_HTML -->", items);

            /* Insert Spell */
            var spells = "",
             ltemplate = load(this.FTC_SPELL_LEVEL),
             stemplate = load(this.FTC_SPELL_HTML);
            $.each(obj.data.ftc.spellLevels, function(l, s){
                spells += parse(ltemplate, s);
                $.each(s.spells, function(i, p){
                    spells += parse(stemplate, p);
                });
            });
            main = main.replace("<!-- FTC_SPELLS_HTML -->", spells);
         }

        /* Evaluate Object Data */
        var html = parse(main, obj.data)

        /* Assign the sheet a UID */
        sheet = $(html);
        sheet.attr("id", "ftc-"+obj._uid);
        return sheet;
    },

    /* ------------------------------------------- */

    render_charsheet: function(obj, app, scope) {
        /* Render Character Sheet UI Element */

        // Configure Object
        obj = this.enrichCharacter(obj, scope);

        // Configure HTML
	    var html = this.renderCharsheetHTML(obj, scope);

        // Activate Sheet Tabs
        FTC.ui.activate_tabs(html, obj, app);

        // Enable Edit Fields and Listeners
        FTC.events.edit_value_fields(html, obj, app);
        FTC.events.edit_checkbox_fields(html, obj, app);
        FTC.events.edit_image_fields(html, obj, app);
        FTC.events.edit_mce_fields(html, obj, app);
        FTC.events.edit_item_fields(html, obj, app);
        FTC.events.edit_spell_fields(html, obj, app);

        // Enable Clickable Sheet Actions
        FTC.actions.attribute_actions(html, obj, app);
        FTC.actions.skill_actions(html, obj, app);

        // Sechedule Cleanup Actions
        FTC.ui.cleanup_app(app);
        return html;
    }
}

// End FTCInit
});


/* -------------------------------------------- */
/* Character Sheet Sync Render					*/
/* -------------------------------------------- */

sync.render("FTC_CHARSHEET", function(obj, app, scope) {
    return FTC.character.render_charsheet(obj, app, scope);
});
