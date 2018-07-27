
/* ------------------------------------------- */
/*  Actor Data Model                           */
/* ------------------------------------------- */

FTC.actors = {
    "_t": "c",
    "info": {
        "name": { "name": "Name" },
        "img": { "name": "Artwork" },
        "notes": { "name": "Description" },
        "race": { "name": "Race" },
        "class": { "name": "Class" },
        "background": { "name": "Background" },
        "alignment": { "name": "Alignment" },
    },

    "experience": {
        "level": { "name": "Level" },
        "cr": { "name": "Challenge Rating" },
        "exp": { "name": "Experience" }
    },

    "attributes": {
        "hp": { "name": "Hit Points" },
        "hd": { "name": "Hit Dice" },
        "proficiency": { "name": "Proficiency Bonus" },
        "ac": { "name": "Armor Class" },
        "speed": { "name": "Movement Speed" },
        "initiative": { "name": "Initiative Modifier" },
        "offensive": { "name": "Weapon Modifier" },
        "spellcasting": { "name": "Spellcasting Ability" },
        "inspiration": { "name": "Inspiration" },
        "death": { "name": "Death Saves" }
    },

    "traits": {
        "size": { "name": "Size" },
        "di": { "name": "Damage Immunities" },
        "dr": { "name": "Damage Resistances" },
        "ci": { "name": "Condition Immunities" },
        "dv": { "name": "Damage Vulnerabilities" },
        "senses": { "name": "Senses" },
        "languages": { "name": "Languages" },
    },

    "personality": {
        "traits": { "name": "Traits" },
        "ideals": { "name": "Ideals" },
        "bonds": { "name": "Bonds" },
        "flaws": { "name": "Flaws" },
    },

    "abilities": {
        "str": { "name": "Strength" },
        "dex": { "name": "Dexterity" },
        "con": { "name": "Constitution" },
        "int": { "name": "Intelligence" },
        "wis": { "name": "Wisdom" },
        "cha": { "name": "Charisma" }
    },

    "skills": {
        "acr": { "name": "Acrobatics", "ability": "dex" },
        "ani": { "name": "Animal Handling", "ability": "wis" },
        "arc": { "name": "Arcana", "ability": "int" },
        "ath": { "name": "Athletics", "ability": "str" },
        "dec": { "name": "Deception", "ability": "cha" },
        "his": { "name": "History", "ability": "int" },
        "ins": { "name": "Insight", "ability": "wis" },
        "int": { "name": "Intimidation", "ability": "cha" },
        "inv": { "name": "Investigation", "ability": "int" },
        "med": { "name": "Medicine", "ability": "wis" },
        "nat": { "name": "Nature", "ability": "int" },
        "per": { "name": "Perception", "ability": "wis" },
        "pfm": { "name": "Performance", "ability": "cha" },
        "prs": { "name": "Persuasion", "ability": "cha" },
        "rel": { "name": "Religion", "ability": "int" },
        "sle": { "name": "Sleight of Hand", "ability": "dex" },
        "ste": { "name": "Stealth", "ability": "dex" },
        "sur": { "name": "Survival", "ability": "wis" }
    },

    "currency": {
        "gp": { "name": "Gold" },
        "sp": { "name": "Silver" },
        "ep": { "name": "Electrum" },
        "cp": { "name": "Copper" }
    },

    "spells": {
        "spell0": { "name": "Cantrip" },
        "spell1": { "name": "1st Level" },
        "spell2": { "name": "2nd Level" },
        "spell3": { "name": "3rd Level" },
        "spell4": { "name": "4th Level" },
        "spell5": { "name": "5th Level" },
        "spell6": { "name": "6th Level" },
        "spell7": { "name": "7th Level" },
        "spell8": { "name": "8th Level" },
        "spell9": { "name": "9th Level" }
    },

    "resources": {
        "legendary": { "name": "Legendary Actions" },
        "primary": { "name": "Primary Resource" },
        "secondary": { "name": "Secondary Resource" },
    },

    "source": { "name": "Source" },
    "tags": {},

    "inventory": [],
    "spellbook": [],
    "feats": []
};


/* ------------------------------------------- */
/* Character Object Type                       */
/* ------------------------------------------- */

class FTCActor extends FTCEntity {

    constructor(object, context) {
        super(object, context);

        // Store container sorting order
        this._sorting = {
            "inventory": [],
            "spellbook": [],
            "feats": []
        }
    }

    /* ------------------------------------------- */

    /* Templates */
    get templates() {
        const td = FTC.TEMPLATE_DIR + "actors/";
        return {
            "BODY": td + "body.html"
        }
    }

    /* ------------------------------------------- */

    static applyDataModel() {

        // Update Actor Templates
        $.each(game.templates.actors, function(type, definition) {
            ftc_merge(definition, FTC.actors, true, true, true);
            definition["_type"] = type;
        });
        console.log("Foundry Tactics - Actor Templates Updated");
    }

    /* ------------------------------------------- */

    convertData(data) {

        // Level
        data.experience.level.current = Math.min(Math.max(data.experience.level.current, 1), 20);

        // Ability Scores and Modifiers
        $.each(data.abilities, function(_, a) {
            a.current = a.current || sync.eval("4d6k3");
            a.modifiers = { "mod": Math.floor(( a.current - 10 ) / 2) };
        });

        // Update Proficiency Bonus
        let lvl = Math.max(data.experience.level.current, data.experience.cr.current);
        data.attributes.proficiency.current = Math.floor((lvl + 7) / 4);

        // Return converted data
        return data;
    }

    /* ------------------------------------------- */

    enrichData(data, scope) {

        // Populate core character data
        this.getCoreData(data);

        // // Set up owned items
        // this.setupInventory(data);
        // this.setupSpellbook(data);
        // this.setupFeats(data);

        // Return the enriched data
        return data;
    }

    /* ------------------------------------------- */

    getCoreData(data) {
        /* This function exists to prepare all the standard rules data that would be used by dice rolling in D&D5e.
        */

        // Experience, level, hit dice
        let xp = data.experience;
        xp["lvl"] = xp.level.current,
        xp["start"] = this.getLevelExp(xp.lvl - 1);
        xp["cur"] = Math.max(xp.exp.current, xp.start);
        xp["next"] = this.getLevelExp(xp.lvl);
        xp["pct"] = Math.min(((xp.cur - xp.start) * 100 / (xp.next - xp.start)), 99.5);
        xp["css"] = (xp.cur > xp.next) ? "leveled" : "";
        xp["kill"] = this.getKillExp(xp.cr.current);
        data.attributes.hd.max = xp.lvl;

        // Abilities
        $.each(data.abilities, function(attr, a) {
            a.prof = parseInt(a.proficient || 0) * data.attributes.proficiency.current;
            a.mod = a.modifiers.mod;
            a.modstr = a.mod.signedString();
            a.valstr = a.current.paddedString(2);
        });

        // Skills
        $.each(data.skills, function(skl, s) {
           s.mod = data.abilities[s.ability].mod;
           s.prof = parseInt(s.current || 0) * data.attributes.proficiency.current;
           s.modstr = s.mod.signedString();
        });

        // Initiative
        data.attributes.initiative.mod = data.abilities.dex.mod + parseInt(data.attributes.initiative.current || 0);
        data.attributes.initiative.str = data.attributes.initiative.mod.signedString() + '.' + data.abilities.dex.valstr;

        // Modifiers
        data.attributes.offensive.current = data.attributes.offensive.current || "str";
        data.attributes.offensive.mod = data.abilities[data.attributes.offensive.current].mod;

        data.attributes.spellcasting.current = data.attributes.spellcasting.current || "int";
        data.attributes.spellcasting.mod = data.abilities[data.attributes.spellcasting.current].mod;
        data.attributes.spellcasting.dc = 8 + data.attributes.proficiency.current + data.attributes.spellcasting.mod;
        data.attributes.spellcasting.dcstr = "Spell DC " + data.attributes.spellcasting.dc;

        // Armor Class
        data.attributes.ac.base = 10 + data.abilities.dex.mod;
    }

    /* ------------------------------------------- */

    getLevelExp(level) {
        const levels = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
                  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
        return levels[Math.min(level, levels.length - 1)];
    }

    getKillExp(cr) {
        cr = eval(cr);
        if (cr < 1.0) return Math.max(200 * cr, 10);
        let _ = undefined;
        const xps = [10, 200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 18000, 20000, 22000,
            25000, 27500, 30000, 32500, 36500, _, _, _, _, _, 155000];
        return xps[cr];
    }

    /* ------------------------------------------- */

    buildHTML(data, scope) {

        // Determine and load primary template
        let html = FTC.loadTemplate(this.templates["BODY"]);
        return html;
    }

    /* ------------------------------------------- */

    activateListeners(html, app, scope) {
        const self = this;

        // Activate Tabs and Editable Fields
        FTC.ui.activateTabs(html, this, app);
        FTC.forms.activateFields(html, this, app);
    }

    /* ------------------------------------------- */
}



/* ------------------------------------------- */
/*  Actors Initialization Hook                 */
/* ------------------------------------------- */


hook.add("FTCInit", "Actors", function() {

    // Apply the Item Data Model
    FTCActor.applyDataModel();

    // Render Item Sheets
    sync.render("FTC_RENDER_ACTOR", function(obj, app, scope) {
        const actor = new FTCActor(obj);
        return actor.render(app, scope);
    });
});


/* ------------------------------------------- */
/*  V2 Converter                               */
/* ------------------------------------------- */

function ftc_migrateActor(d) {

    // Assign type
    d._type = ( d.tags.npc === 1 ) ? "NPC": "Character";

    // Rename feats
    if ( d.abilities && ! d.feats ) d.feats = d.abilities;
    d.abilities = {};

    // Experience
    let exp = ["level", "cr", "exp"];
    d.experience = {};
    $.each(exp, function(_, t) { d.experience[t] = d.counters[t]; });

    // Attributes
    let off = d.info.offensive.current,
        spell = d.info.spellcasting.current;
    d.attributes = {
        "offensive": { "current": ( off === undefined ) ? off : off.toLowerCase() },
        "spellcasting": { "current": ( spell === undefined ) ? spell : spell.toLowerCase() }
    };
    let attrs = ["hp", "hd", "proficiency", "ac", "speed", "initiative", "inspiration"];
    $.each(attrs, function(_, a) { d.attributes[a] = d.counters[a]; });

    // Traits
    d.traits = {};
    let traits = ["size", "di", "dr", "ci", "dv", "senses", "languages"];
    $.each(traits, function(_, t) { d.traits[t] = d.info[t]; });

    // Personality
    d.personality = {};
    let personality = ["traits", "ideals", "bonds", "flaws"];
    $.each(personality, function(_, t) { d.personality[t] = d.info[t]; });

    // Stats
    $.each(d.stats, function(n, s) { d.abilities[n.toLowerCase()] = s; });

    // Currency
    d.currency = {};
    let currency = ["gp", "sp", "cp"];
    $.each(currency, function(_, c) { d.currency[c] = d.counters[c]; });

    // Spells
    d.spells = {};
    let spells = ["spell0", "spell1", "spell2", "spell3", "spell4", "spell5", "spell6", "spell7", "spell8", "spell9"];
    $.each(spells, function(_, s) { d.spells[s] = d.counters[s]; });

    // Resources
    d.resources = {
        "legendary": d.counters["legendary"],
        "primary": d.counters["class1"],
        "secondary": d.counters["class2"]
    };

    // Owned Elements
    let containers = ["inventory", "spellbook", "feats"];
    $.each(containers, function(_, c) {
        let container = d[c];
        $.each(container, function(i, item) {
            container[i] = ftc_migrateElement(item);
        });
    });

    // Start by merging against the new data template
    let template = game.templates.actors[d._type],
        data = mergeObject(template, d, true, false, false);

    // Clean any residual data
    cleanObject(data, template, true, true);
    $.each(data, function(name, _) {
        if ( name.startsWith("_") && !["_t", "_type"].includes(name)) delete data[name];
    });
    return data
}
