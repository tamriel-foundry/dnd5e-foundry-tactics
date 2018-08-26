
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
/* Actor Object Type                       */
/* ------------------------------------------- */

class FTCActor extends FTCEntity {

  static getElement(type) {
    /* Get the specialized Element class definition for a certain type */
    const classes = {
      "Character": FTCActor,
      "NPC": FTCNPC
    };
    return classes[type] || FTCElement;
  }

  static fromData(obj, context) {
    /* A factory method which returns a specialized class for elements of a certain type */
    const cls = this.getElement(obj._type || obj.data._type);
    return new cls(obj, context);
  }

  /* ------------------------------------------- */

  constructor(object, context) {
    super(object, context);

    // Store container sorting order
    this._sorted = {
      "inventory": false,
      "spellbook": false,
      "feats": false
    }
  }

  /* ------------------------------------------- */

  static applyDataModel() {
    /* Update actor templates with the latest definitions */
    $.each(game.templates.actors, function (type, definition) {
      mergeObject(definition, FTC.actors, true, true, true);
      definition["_type"] = type;
    });
    console.log("Foundry Tactics | Actor Templates Updated");
  }

  /* ------------------------------------------- */

  convertData(data) {

    // Level
    let lvl = Math.min(Math.max(data.experience.level.current || 1, 1), 20);
    data.experience.level.current = lvl;

    // Ability Scores and Modifiers
    $.each(data.abilities, function (_, a) {
      a.current = a.current || sync.eval("4d6k3");
      a.modifiers = {"mod": Math.floor(( a.current - 10 ) / 2)};
    });

    // Update Proficiency Bonus
    data.attributes.proficiency.current = Math.floor((lvl + 7) / 4);
    return data;
  }

  /* ------------------------------------------- */
  /*  Data Pre-processing                        */
  /* ------------------------------------------- */

  enrichData(data, scope) {

    // Populate core character data
    this.getCoreData(data);

    // Get data for owned elements
    this.setupInventory(data);
    this.setupSpellbook(data);
    this.setupFeats(data);

    // Return the enriched data
    return data;
  }

  /* ------------------------------------------- */

  getCoreData(data) {
    /* This function exists to prepare all the standard rules data that would be used by dice rolling in D&D5e.
     */

    // If no data was provided, make a copy
    data = data || duplicate(this.data);

    // Experience, level, hit dice
    let xp = data.experience;
    xp["lvl"] = xp.level.current;
    xp["start"] = this.getLevelExp(xp.lvl - 1);
    xp["current"] = Math.max(xp.exp.current || 0, xp.start);
    xp["next"] = this.getLevelExp(xp.lvl);
    xp["pct"] = Math.min(((xp.current - xp.start) * 100 / (xp.next - xp.start)), 99.5);
    xp["css"] = (xp.current > xp.next) ? "leveled" : "";
    xp["kill"] = this.getKillExp(xp.cr.current);
    data.attributes.hd.max = xp.lvl;

    // Abilities
    $.each(data.abilities, function (attr, a) {
      a.prof = parseInt(a.proficient || 0) * data.attributes.proficiency.current;
      a.mod = a.modifiers.mod;
      a.modstr = a.mod.signedString();
      a.valstr = a.current.paddedString(2);
    });

    // Skills
    $.each(data.skills, function (skl, s) {
      s.current = parseInt(s.current || 0);
      s.prof = s.current * data.attributes.proficiency.current;
      s.mod = data.abilities[s.ability].mod;
      s.modstr = (s.mod + s.prof).signedString();
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
    return data;
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
    const xps = [10, 200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000,
      18000, 20000, 22000, 25000, 33000, 41000, 50000, 62000, 75000, 90000, 105000, 120000, 135000, 155000];
    return xps[cr];
  }

  /* ------------------------------------------- */

  setupInventory(data) {
    // Set up inventory items by converting them to FTCItem objects

    const owner = this;
    const weight = [];
    const inventory = {
      "Weapon": {
        "name": "Weapons",
        "items": []
      },
      "Armor": {
        "name": "Equipment",
        "items": []
      },
      "Tool": {
        "name": "Tools",
        "items": []
      },
      "Consumable": {
        "name": "Consumables",
        "items": []
      },
      "Item": {
        "name": "Backpack",
        "items": []
      }
    };

    // Iterate over inventory items
    $.each(data.inventory, function (itemId, itemData) {
      let item = FTCElement.fromData(itemData, {"owner": owner});

      // Set id and class
      item.data.itemId = itemId;
      item.data.css = item.type.toLowerCase();

      // Flag whether the item is rollable
      item.data.rollable = owner.isOwner ? "ftc-rollable" : "";

      // Push to type
      inventory[item.type].items.push(item);

      // Record total entry weight
      weight.push(parseFloat(item.data.weight.current * item.data.quantity.current));
    });
    data.inventory = inventory;

    // Compute weight and encumbrance
    let wt = (weight.length > 0) ? weight.reduce(function (total, num) {
        return total + (num || 0);
      }) : 0,
      enc = data.abilities.str.current * 15,
      pct = Math.min(wt * 100 / enc, 99.5),
      cls = (pct > 90 ) ? "heavy" : "";
    data["weight"] = {"wt": wt.toFixed(2), "enc": enc, "pct": pct.toFixed(2), "cls": cls};
    return data;
  }

  /* ------------------------------------------- */

  setupSpellbook(data) {
    /* Set up spellbook items by converting them to FTCItem objects */
    const owner = this;
    const sls = {};

    // Iterate over spellbook spells
    $.each(data.spellbook, function (spellId, itemData) {

      // Construct the item object
      let item = new FTCSpell(itemData, {"owner": owner});
      item.data.spellId = spellId;

      // Construct spell data
      let lvl = parseInt(item.data.level.current || 0);

      // Record spell-level
      sls[lvl] = sls[lvl] || {
          "level": lvl,
          "name": (lvl === 0) ? "Cantrip" : lvl.ordinalString() + " Level",
          "current": FTC.getProperty(data, 'spells.spell' + lvl + '.current') || 0,
          "max": FTC.getProperty(data, 'spells.spell' + lvl + '.max') || 0,
          "spells": [],
        };
      sls[lvl].current = (lvl === 0) ? "&infin;" : sls[lvl].current;
      sls[lvl].max = (lvl === 0) ? "&infin;" : sls[lvl].max;
      sls[lvl].spells.push(item);
    });
    data['spellbook'] = sls;
    return data;
  }

  /* ------------------------------------------- */

  setupFeats(data) {
    /* Set up feat items by converting them to FTCItem objects
     */
    const owner = this;
    const feats = [];
    $.each(data.feats, function (itemId, itemData) {
      let item = FTCElement.fromData(itemData, {"owner": owner});
      item.data.itemId = itemId;
      feats.push(item);
    });
    data.feats = feats;
    return data;
  }

  /* ------------------------------------------- */
  /*  HTML Rendering                             */
  /* ------------------------------------------- */

  get template() {
    return FTC.TEMPLATE_DIR + "actors/character.html";
  }

  get templateParts() {
    const td = FTC.TEMPLATE_DIR + "actors/";
    let parts = {
      "PRIMARY_ATTRIBUTES": td + "attributes.html",
      "SECONDARY_ATTRIBUTES": td + "attributes2.html",
      "SIDEBAR_ATTRIBUTES": td + "attributes3.html",
      "NPC_ATTRIBUTES": td + "attributes-npc.html",
      "CURRENCY": td + "currency.html",
      "TRAITS": td + "traits.html"
    };
    if (hasSecurity(getCookie("UserID"), "Assistant Master")) parts["SIDEBAR_OPTIONS"] = td + "options.html";
    return parts;
  }

  /* ------------------------------------------- */

  buildHTML(data, scope) {

    // Populate primary templates
    let html = FTC.loadTemplate(this.template);
    $.each(this.templateParts, function (name, path) {
      html = FTC.injectTemplate(html, name, path);
    });

    // Abilities and Skills
    html = this._buildAbilities(html, data);
    html = this._buildSkills(html, data);

    // Owned Elements
    html = this._buildInventory(html, data);
    html = this._buildSpellbook(html, data);
    html = this._buildFeats(html, data);
    return html;
  }

  /* ------------------------------------------- */

  _buildAbilities(html, data) {
    let abilities = "",
      template = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/ability.html');
    $.each(data.abilities, function (a, ability) {
      ability.ability = a;
      abilities += FTC.populateTemplate(template, ability);
    });
    return html.replace("<!-- ABILITIES -->", abilities);
  }

  /* ------------------------------------------- */

  _buildSkills(html, data) {
    let skills = "",
      template = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/skill.html');
    $.each(data.skills, function (s, skill) {
      skill.skill = s;
      skills += FTC.populateTemplate(template, skill);
    });
    return html.replace("<!-- SKILLS -->", skills);
  }

  /* ------------------------------------------- */

  _buildInventory(html, data) {
    let inventory = "",
      itemHeader = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/elements/item-header.html'),
      itemTemplate = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/elements/item.html');
    $.each(data.inventory, function (t, type) {
      type.type = t;
      type.css = t.toLowerCase();
      let collection = FTC.populateTemplate(itemHeader, type),
        items = "";
      $.each(type.items, function (_, item) {
        items += FTC.populateTemplate(itemTemplate, item.data);
      });
      inventory += collection.replace("<!-- ITEMS -->", items);
    });
    inventory = inventory || '<blockquote class="compendium">Add items from the compendium.</blockquote>';
    return html.replace("<!-- INVENTORY -->", inventory);
  }

  /* ------------------------------------------- */

  _buildSpellbook(html, data) {
    let spellbook = "",
      spellHeader = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/elements/spell-header.html'),
      spellTemplate = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/elements/spell.html');
    $.each(data.spellbook, function (l, level) {
      let page = FTC.populateTemplate(spellHeader, level),
        spells = "";
      $.each(level.spells, function (_, spell) {
        spells += FTC.populateTemplate(spellTemplate, spell.data);
      });
      spellbook += page.replace("<!-- SPELLS -->", spells);
    });
    spellbook = spellbook || '<blockquote class="compendium">Add spells from the compendium.</blockquote>';
    return html.replace("<!-- SPELLBOOK -->", spellbook);
  }

  /* ------------------------------------------- */

  _buildFeats(html, data) {
    let feats = "",
      featTemplate = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'actors/elements/feat.html');
    $.each(data.feats, function (i, item) {
      feats += FTC.populateTemplate(featTemplate, item.data);
    });
    feats = feats || '<blockquote class="compendium">Add feats from the compendium.</blockquote>';
    return html.replace("<!-- FEATS -->", feats);
  }

  /* ------------------------------------------- */
  /*  Event Handlers                             */
  /* ------------------------------------------- */

  activateListeners(html, app, scope) {
    const self = this;

    // Activate rollable actions on a timeout to prevent accidentally clicking immediately when the sheet opens
    setTimeout(function () {

      // Attribute rolls
      html.find('.ability .ftc-rollable').click(function () {
        let attr = $(this).parent().attr("data-ability");
        self.rollAbility(attr);
      });

      // Skill rolls
      html.find('.skill .ftc-rollable').click(function () {
        let skl = $(this).parent().attr("data-skill");
        self.rollSkill(skl);
      });

      // Weapon actions
      html.find(".item .ftc-rollable").click(function () {
        const itemId = $(this).closest("li.item").attr("data-item-id"),
          itemData = self.data.inventory[itemId];
        const item = FTCElement.fromData(itemData, {"owner": self, "itemId": itemId});
        item.chatAction();
      });

      // Spell actions
      html.find(".spell .ftc-rollable").click(function () {
        const itemId = $(this).closest("li.spell").attr("data-item-id"),
          itemData = self.data.spellbook[itemId];
        const spell = new FTCSpell(itemData, {"owner": self, "itemId": itemId});
        spell.chatAction();
      });

      // Feat actions
      html.find(".feat .ftc-rollable").click(function () {
        const itemId = $(this).closest("li.feat").attr("data-item-id"),
          itemData = self.data.feats[itemId];
        const feat = new FTCFeat(itemData, {"owner": self, "itemId": itemId});
        feat.chatAction();
      });
    });

    // NPC Toggle
    html.find(".ftc-checkbox.npc-toggle").change(function () {
      let isNPC = $(this).prop("checked") + 0 || 0;
      self.data._type = isNPC ? "NPC" : "Character";
    });

    // Enable Element Sorting
    this.enableSorting(html);

    // Activate Tabs and Editable Fields
    FTC.ui.activateTabs(html, this, app);
    FTC.forms.activateFields(html, this, app);
  }

  /* ------------------------------------------- */
  /*  Owned Element Management                   */
  /* ------------------------------------------- */

  createItem(container, data) {
    this.save();
    this.data[container].push(data);
    FTCElement.editOwnedItem(this, container, data, this.data[container].length - 1);
  }

  /* ------------------------------------------- */

  dropItem(item) {
    this.data[item.container].push(item.data);
    this._changed = true;
    this.save();
  }

  /* ------------------------------------------- */

  editItem(container, itemId) {
    const data = this.data[container][itemId];
    FTCElement.editOwnedItem(this, container, data, itemId);
  }

  /* ------------------------------------------- */

  updateItem(container, itemId, itemData) {
    this.data[container][itemId] = itemData;
    this._changed = true;
    this.save();
  }

  /* ------------------------------------------- */

  deleteItem(container, itemId) {
    this._sorted[container] = true;
  }

  /* ------------------------------------------- */

  castSpell(level) {
    if (level === 0) return;
    let sl = this.data.spells["spell" + level];
    if ( !sl.current ) return;
    sl.current = Math.max(sl.current - 1, 0);
    this._changed = true;
    this.save();
  }

  /* ------------------------------------------- */
  /*  Element Sorting                            */
  /* ------------------------------------------- */

  enableSorting(html) {
    const self = this;
    html.find(".item-list").sortable({
      "items": " > li",
      "cancel": ".inventory-header",
      "containment": "parent",
      "axis": "y",
      "opacity": 0.75,
      "delay": 200,
      "scope": $(this).attr("data-item-container"),
      "update": function (event, ui) {
        let container = ui.item.parent().attr("data-item-container");
        self._sorted[container] = true;
      }
    });
  }

  /* ------------------------------------------- */

  updateSort() {
    /* Process pending element sorting order, reordering container data */
    const self = this;

    // Iterate over each sorted container
    $.each(this._sorted, function (container, isSorted) {
      if (!isSorted) return;

      // Get the current sorting of the container
      const list = self.app.find("." + container);
      let sorted = [];
      list.find("li.element").each(function () {
        let itemId = $(this).attr("data-item-id");
        sorted.push(self.data[container][itemId]);
      });

      // Update sorting
      self.data[container] = sorted;
      self._sorted[container] = false;
      self._changed = true;
      console.log(self.name + " | Updated " + container + " sort order.")
    });
  }

  /* ------------------------------------------- */
  /*  Saving and Cleanup                         */
  /* ------------------------------------------- */

  cleanup() {
    this.updateSort();
    super.cleanup();
  }

  save() {
    this.updateSort();
    super.save();
  }
}


/* ------------------------------------------- */
/*  NPC CLASS                                  */
/* ------------------------------------------- */


class FTCNPC extends FTCActor {

  convertData(data) {
    data = super.convertData(data);
    data._flags["npc"] = 1;

    // CR
    let cr = eval(data.experience.cr.current || 0);
    data.experience.cr.current = cr;

    // Update Proficiency Bonus
    data.attributes.proficiency.current = Math.max(Math.floor((cr + 7) / 4), 2);
    return data;
  }

  /* ------------------------------------------- */

  get template() {
    return FTC.TEMPLATE_DIR + "actors/npc.html";
  }

  get templateParts() {
    const td = FTC.TEMPLATE_DIR + "actors/";
    let parts = {
      "NPC_ATTRIBUTES": td + "attributes-npc.html",
      "SIDEBAR_ATTRIBUTES": td + "attributes3.html",
      "CURRENCY": td + "currency.html",
      "TRAITS": td + "traits.html"
    };
    if (hasSecurity(getCookie("UserID"), "Assistant Master")) parts["SIDEBAR_OPTIONS"] = td + "options.html";
    return parts;
  }
}

/* ------------------------------------------- */
/*  Actors Initialization Hook                 */
/* ------------------------------------------- */


hook.add("FTCInit", "Actors", function() {

  // Apply the Item Data Model
  FTCActor.applyDataModel();

  // Render Item Sheets
  sync.render("FTC_RENDER_ACTOR", function (obj, app, scope) {
    const actor = FTCActor.fromData(obj, scope);
    return actor.render(app, scope);
  });
});


/* ------------------------------------------- */
