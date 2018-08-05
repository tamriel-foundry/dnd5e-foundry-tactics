
/* ------------------------------------------- */
/*  ACTORS                                     */
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


/* ------------------------------------------- */
/*  ELEMENTS                                   */
/* ------------------------------------------- */


function ftc_migrateElement(i) {

    // Assign type
    i._type = i.info.type.current.capitalize();
    i._type = (i._type === "Ability") ? "Feat": i._type;

    // Move attributes to root
    let sections = ["info", "armor", "weapon", "spell"];
    $.each(sections, function(_, section) {
        mergeObject(i, i[section], true, false, true);
    });

    // Rename attributes
    i.type = i.variety;
    i.strength = i.str;
    i.stealth = i.ste;
    if (i._type === "Feat") i.cost = i.materials;

    // Start by merging against the new data template
    let template = game.templates.elements[i._type],
        data = mergeObject(template, i, true, false, false);

    // Clean any residual data
    cleanObject(data, template, true, true);
    $.each(data, function(name, _) {
        if ( name.startsWith("_") && !["_t", "_type"].includes(name)) delete data[name];
    });
    return data
}

/* ------------------------------------------- */