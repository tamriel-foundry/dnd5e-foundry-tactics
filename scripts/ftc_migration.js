
/* ------------------------------------------- */
/*  ACTORS                                     */
/* ------------------------------------------- */


function ftc_migrateActor(d, compendium=false) {

  // V1 -> V2 Migration if the actor does not yet have a _type
  if ( !i._type ) {

    // Assign type
    d._type = ( d.tags.npc === 1 ) ? "NPC" : "Character";

    // Rename feats
    if (d.abilities && !d.feats) d.feats = d.abilities;
    d.abilities = {};

    // Experience
    let exp = ["level", "cr", "exp"];
    d.experience = {};
    $.each(exp, function (_, t) {
      d.experience[t] = d.counters[t];
    });

    // Attributes
    let off = d.info.offensive.current,
      spell = d.info.spellcasting.current;
    d.attributes = {
      "offensive": {"current": ( off === undefined ) ? off : off.toLowerCase()},
      "spellcasting": {"current": ( spell === undefined ) ? spell : spell.toLowerCase()}
    };
    let attrs = ["hp", "hd", "proficiency", "ac", "speed", "initiative", "inspiration"];
    $.each(attrs, function (_, a) {
      d.attributes[a] = d.counters[a];
    });

    // Traits
    d.traits = {};
    let traits = ["size", "di", "dr", "ci", "dv", "senses", "languages"];
    $.each(traits, function (_, t) {
      d.traits[t] = d.info[t];
    });

    // Personality
    d.personality = {};
    let personality = ["traits", "ideals", "bonds", "flaws"];
    $.each(personality, function (_, t) {
      d.personality[t] = d.info[t];
    });

    // Stats
    $.each(d.stats, function (n, s) {
      d.abilities[n.toLowerCase()] = s;
    });

    // Currency
    d.currency = {};
    let currency = ["gp", "sp", "cp"];
    $.each(currency, function (_, c) {
      d.currency[c] = d.counters[c];
    });

    // Spells
    d.spells = {};
    let spells = ["spell0", "spell1", "spell2", "spell3", "spell4", "spell5", "spell6", "spell7", "spell8", "spell9"];
    $.each(spells, function (_, s) {
      d.spells[s] = d.counters[s];
    });

    // Resources
    d.resources = {
      "legendary": d.counters["legendary"],
      "primary": d.counters["class1"],
      "secondary": d.counters["class2"]
    };

    // Owned Elements
    let containers = ["inventory", "spellbook", "feats"];
    $.each(containers, function (_, c) {
      let container = d[c];
      $.each(container, function (i, item) {
        container[i] = ftc_migrateElement(item, compendium);
      });
    });
  }

  // Merge the element against the latest data template
  let template = game.templates.actors[d._type],
    data = mergeObject(template, i, true, false, false);

  // Clean any residual data
  cleanObject(data, template, true, !compendium);
  return data;
}


/* ------------------------------------------- */
/*  ELEMENTS                                   */
/* ------------------------------------------- */


function ftc_migrateElement(i, compendium=false) {

  // V1 -> V2 Migration if the element does not yet have a _type
  if ( !i._type ) {

    // Assign type
    i._type = ( i.info.type ) ? i.info.type.current || "Item" : "Item";
    i._type = i._type.capitalize();
    i._type = (i._type === "Ability") ? "Feat": i._type;
    i._type = (i._type === "Note") ? "Item": i._type;

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
  }

  // Merge the element against the latest data template
  let template = game.templates.elements[i._type];
  let data = mergeObject(template, i, true, false, false);

  // Clean any residual data
  cleanObject(data, template, true, !compendium);
  return data
}


/* -------------------------------------------- */


ftc_updateCompendium = function(filename) {
  if (!game.locals.workshop) {
    console.log("Failure: You must first open the Compendium tab");
    return;
  }

  // Iterate over pack sections
  const pack = game.locals.workshop.data[filename];
  $.each(pack.data.content, function (name, section) {
    let type = section._t;
    $.each(section.data, function (i, data) {
      console.log("Updating compendium entry: " + data.info.name.current);
      if (type === "i") section.data[i] = ftc_migrateElement(data, true);
      else if (type === "c") section.data[i] = ftc_migrateActor(data, true);
    });
  });

  // Export the data to JSON and save
  runCommand("savePack", {key: filename, data: JSON.stringify(pack.data, 2, 2)});
  console.log("Successfully migrated compendium: " + filename)
};


/* -------------------------------------------- */


ftc_updateWorld = function() {

  // Clear chat log
  runCommand("emptyEventLog");

  // Update game templates and apply new data models
  const template = duplicate(game.locals.gameList[FTC_SYSTEM_IDENTIFIER]);
  game.templates = template;
  FTCActor.applyDataModel();
  FTCElement.applyDataModel();

  // Iterate over game entities
  $.each(game.entities.data, function (_, obj) {
    let type = obj.data._t;
    if (type === "i") {
      obj.data = ftc_migrateElement(obj.data, false);
      obj.sync("updateAsset");
      console.log("Updating element: " + obj.data.info.name.current);
    }
    else if (type === "c") {
      obj.data = ftc_migrateActor(obj.data, false);
      obj.sync("updateAsset");
      console.log("Updating actor: " + obj.data.info.name.current);
    }
  });

  // Apply the game template update
  console.log("Successfully migrated world file to latest build");
  runCommand("updateTemplate", template);
};


/* ------------------------------------------- */


function ftc_promptUpdate() {

    // Is it a v1 build?
  let ver = game.locals.gameList[FTC_SYSTEM_IDENTIFIER].version;
  if ( game.templates.build === "v2" && game.templates.version === ver ) return;

  // Prompt for world update
  const html = $('<section id="ftc-update"><h1>Update Required</h1><hr/></section>');
  html.append("<p>The D&D5e Foundry Tactics mod has been updated. In order to continue having the best experience," +
    "you should update your world file to the latest data template.</p>");
  html.append("<blockquote><strong>Important:</strong> Before proceeding, please backup your world file. While the " +
    "update process is expected to proceed, in case anything goes wrong be sure to backup your data before " +
    "continuing.</blockquote>");
  html.append("<p>Your chat log will be cleared as a result of this action. If there are any conversations or dice " +
    "roll results in your log which you need to record, please do so before updating.</p>");
  html.append("<p>Once you are ready to proceed, push the button below and the update will be applied!</p>");

  // Create a dialog
  FTC.ui.createDialogue(html, {
    "title": "D&D5e Foundry Tactics",
    "buttons": {
      "Proceed with Update": function() {
        ftc_updateWorld();
        $(this).dialog("close");
        $(this).dialog("destroy");
        ftc_promptSuccess();
      }
    },
    "modal": true,
    "width": 600
  });
}


/* ------------------------------------------- */


function ftc_promptSuccess() {
  const html = $('<section id="ftc-update"><h1>Update Successful</h1><hr/></section>');
  html.append("<p>Update successful, please press F5 to reload your game.</p>");
  FTC.ui.createDialogue(html, {
    "title": "D&D5e Foundry Tactics",
    "modal": true,
    "width": 600
  });
}


/* ------------------------------------------- */


hook.add("FTCInit", "Migration", function() {
    ftc_promptUpdate();
});


/* ------------------------------------------- */
