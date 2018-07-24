
/* ------------------------------------------- */
/* Character Object Type                       */
/* ------------------------------------------- */

class FTCCharacter extends FTCEntity {

    constructor(obj, context) {
        super(obj, context);

        // Primary Templates
        this.parts = {
            CHARACTER_PRIMARY_STATS: FTC.TEMPLATE_DIR + 'character/primary-stats.html',
            CHARACTER_TAB_TRAITS: FTC.TEMPLATE_DIR + 'character/tab-traits.html',
            INVENTORY_CURRENCY: FTC.TEMPLATE_DIR + 'character/items/inventory-currency.html',
            NPC_PRIMARY_STATS: FTC.TEMPLATE_DIR + 'npc/primary-stats.html',
            NPC_TAB_TRAITS: FTC.TEMPLATE_DIR + 'npc/tab-traits.html'
        };

        // Register local for debugging
        FTC.character = this;

        // Store container sorting order
        this._sorting = {
            "inventory": [],
            "spellbook": [],
            "feats": [],
        };
    }

    /* ------------------------------------------- */

    get isNPC() {
        return (this.data.tags.npc === 1)
    }

    /* ------------------------------------------- */

    get spellDC() {
        let attr = this.data.info.spellcasting.current,
            mod = this.data.stats[attr].modifiers.mod;
        return 8 + mod + this.data.counters.proficiency.current;
    }

    /* ------------------------------------------- */

    save() {
        if (!this.obj || !this._changed) return;
        const self = this;
        console.log("Saving object " + this.name);

        // Update item sorting order
        $.each(this._sorting, function(container, order) {
            if ( !order.length ) return;
            let items = [];
            $.each(order, function(n, o) {
                items[n] = self.data[container][o];
            });
            self.obj.data[container] = items;
        });

        // Save the object
        this.obj.sync("updateAsset");
    }

    /* ------------------------------------------- */
    /* HTML Rendering                              */
    /* ------------------------------------------- */

    refineScope(scope) {
        scope.isPrivate = (scope.viewOnly && (!this.obj || !this.obj.id()));
        return scope;
    }

    /* ------------------------------------------- */

    convertData(data) {

        // Proficiency Bonus
        let lvl = ( this.isNPC ) ? data.counters.cr.current : data.counters.level.current;
        data.counters.proficiency.current = Math.floor((lvl + 7) / 4);

        // Abilities -> Feats
        if ( data.abilities && !data.feats ) {
            data.feats = data.abilities;
            delete data.abilities;
        }
        return data;
    }

    /* ------------------------------------------- */

    enrichData(data, scope) {

        // Populate core character data
        this.getCoreData(data);

        // Set up owned items
        this.setupInventory(data);
        this.setupSpellbook(data);
        this.setupFeats(data);

        // Return the enriched data
        return data;
    }

    /* -------------------------------------------- */

    getCoreData(data) {
        /* This function exists to prepare all the standard rules data that would be used by dice rolling in D&D5e.
        */

        // Provided data, or create a duplicate
        data = data || duplicate(this.data);

        // Experience and level
        let lvl = Math.min(Math.max(data.counters.level.current, 1), 20),
            start = this.getLevelExp(lvl - 1),
            cur = Math.max(data.counters.exp.current, start),
            next = this.getLevelExp(lvl),
            pct = ((cur - start) * 100) / (next - start);
        data['exp'] = {
            "lvl": lvl,
            "current": cur.toLocaleString(),
            "next": next.toLocaleString(),
            "pct": Math.min(pct, 99.5),
            "cls": (pct >= 100) ? "leveled": "",
            "kill": this.getKillExp(data.counters.cr.current)
        };

        // Maximum hit dice
        data.counters.hd.max = lvl;

        // Reference actor data
        data["proficiency"] = data.counters.proficiency.current;
        data["spellcasting"] = data.info.spellcasting.current || "Int";
        data["offensive"] = data.info.offensive.current || "Str";

        // Ability modifiers
        $.each(data.stats, function(a, s) {
            data[a] = {
                "name": s.name,
                "prof": (s.proficient || 0) * data.proficiency,
                "value": s.current,
                "mod": s.modifiers.mod,
                "modstr": (s.modifiers.mod < 0 ? "" : "+" ) + s.modifiers.mod,
                "valstr": FTC.ui.padNumber(s.current, 2)
            }
        });

        // Skill modifiers
        $.each(data.skills, function(n, s) {
            let mod = data[s.stat].mod;
            data[n] = {
                "name": s.name,
                "prof": (s.current || 0) * data.proficiency,
                "stat": s.stat,
                "mod": mod,
                "modstr": (mod < 0 ? "" : "+") + mod
            }
        });

        // Initiative modifier
        let initMod = parseInt(data.stats["Dex"].modifiers.mod) + parseInt(data.counters.initiative.current);
        data["initiative"] = (initMod < 0 ? initMod : "+"+initMod) + "." + data["Dex"].valstr;

        // Weapon and Spell modifiers
        data["spellMod"] = data[data.spellcasting].mod;
        data["spellDC"] = 8 + data.proficiency + data[data.spellcasting].mod;
        data["spellDCstr"] = data[data.spellcasting].mod ? "Spell DC " + data["spellDC"] : "";
        data["weaponMod"] = data[data.offensive].mod;

        // Armor Class
        data["baseAC"] = 10 + data["Dex"].mod;
        return data;
    };

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

    setupInventory(data) {
        // Set up inventory items by converting them to FTCItem objects

        const owner = this,
            weight = [],
            inventory = {
            "weapons": {
                "name": "Weapons",
                "items": [],
                "type": "weapon",
            },
            "equipment": {
                "name": "Equipment",
                "items": [],
                "type": "armor"
            },
            "tools": {
                "name": "Tools",
                "items": [],
                "type": "item",
                "variety": "tool"
            },
            "consumables": {
                "name": "Consumables",
                "items": [],
                "type": "item",
                "variety": "consumable"
            },
            "pack": {
                "name": "Backpack",
                "items": [],
                "type": "item"
            }
        };

        // Iterate over inventory items
        $.each(data.inventory, function(itemId, itemData) {
            let item = new FTCItem(itemData, {"owner": owner, "container": "inventory"});

            // Set id and class
            item.data.itemId = itemId;
            item.data.itemCls = ( item.type === "weapon" && item.weapon.damage.current ) ? "ftc-rollable" : "";

            // Push into type
            if ( item.type === "weapon" ) {
                inventory.weapons.items.push(item);
            } else if ( item.type === "armor" && item.armor.equipped.current === 1 ) {
                inventory.equipment.items.push(item);
            } else if ( item.type === "item" && item.info.variety.current === "tool" ) {
                inventory.tools.items.push(item);
            } else if ( item.type === "item" && item.info.variety.current === "consumable" ) {
                inventory.consumables.items.push(item);
            } else {
                inventory.pack.items.push(item);
            }

            // Record total entry weight
            weight.push(parseFloat(item.info.weight.current || 0) * parseFloat(item.info.quantity.current));
        });
        data.inventory = inventory;

        // Compute weight and encumbrance
        let wt = (weight.length > 0) ? weight.reduce(function(total, num) { return total + (num || 0); }) : 0,
           enc = data.stats.Str.current * 15,
           pct = Math.min(wt * 100 / enc, 99.5),
           cls = (pct > 90 ) ? "heavy" : "";
        data["weight"] = {"wt": wt.toFixed(2), "enc": enc, "pct": pct.toFixed(2), "cls": cls};
        return data;
    }

    /* ------------------------------------------- */

    setupSpellbook(data) {
        /* Set up spellbook items by converting them to FTCItem objects
         */
        const owner = this,
            sls = {};

        // Iterate over spellbook spells
        $.each(data.spellbook, function(spellId, itemData) {

            // Construct the item object
            let item = new FTCItem(itemData, {"owner": owner, "container": "spellbook"}),
                spell = item.spell;

            // Construct spell data
            let lvl = (spell.level.current === "Cantrip") ? 0 : parseInt(spell.level.current || 0);
            item.data.spellid = spellId;

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
        data['spellbook'] = sls;
        return data;
    }

    /* ------------------------------------------- */

    setupFeats(data) {
        /* Set up feat items by converting them to FTCItem objects
         */
        const owner = this,
            feats = [];

        // Iterate over feats
        $.each(data.feats, function(itemId, itemData) {
            let item = new FTCItem(itemData, {"owner": owner, "container": "feats"});
            feats.push(item);
        });
        data.feats = feats;
        return data;
    }

    /* ------------------------------------------- */
    /* Templates and Rendering                     */
    /* ------------------------------------------- */

    getTemplate(data, scope) {
        /* Determine the base HTML template that should be used for the entity
         */

        // Private Preview Template
        if ( scope.isPrivate ) return FTC.TEMPLATE_DIR + 'character/preview-character.html';

        // NPC Template
        else if ( this.isNPC ) return FTC.TEMPLATE_DIR + "npc/npc-sheet.html";

        // Character Sheet
        return FTC.TEMPLATE_DIR + 'character/charsheet.html';
    }

    /* ------------------------------------------- */

    buildHTML(data, scope) {

        // Determine and load primary template
        const template = this.getTemplate(data, scope);
        let main = FTC.loadTemplate(template);

        // Augment sub-components
        if (!scope.isPrivate) {

            // Inject Primary Template Parts
            $.each(this.parts, function(tag, path) {
                main = FTC.injectTemplate(main, tag, path);
            });

            // Abilities and Skills
            main = this._buildAbilities(main, data);
            main = this._buildSkills(main, data);

            // Owned Items - Inventory, Spells, and Feats
            main = this._buildInventory(main, data);
            main = this._buildSpellbook(main, data);
            main = this._buildFeats(main, data);
        }
        return main;
    }

    /* ------------------------------------------- */

    _buildAbilities(html, data) {
        let abilities = "",
            template = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/ability.html');
        for ( var s in data.stats ) {
            abilities += template.replace(/\{stat\}/g, s);
        }
        return html.replace("<!-- ABILITIES_LIST -->", abilities);
    }

    /* ------------------------------------------- */

    _buildSkills(html, data) {
        let skills = "",
            template = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/skill.html');
        for (var s in data.skills) {
            skills += template.replace(/\{skl\}/g, s);
        }
        return html.replace("<!-- FTC_SKILL_HTML -->", skills);
    }

    /* ------------------------------------------- */

    _buildInventory(html, data) {
        let inventory = "",
            itemHeader = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/items/inventory-header.html'),
            itemTemplate = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/items/item.html');
        $.each(data.inventory, function(_, type) {
            let collection = FTC.populateTemplate(itemHeader, type),
                items = "";
            $.each(type.items, function(_, item) {
                items += FTC.populateTemplate(itemTemplate, item.data);
            });
            inventory += collection.replace("<!-- ITEMS -->", items);
        });
        inventory = inventory || '<blockquote class="compendium">Add items from the compendium.</blockquote>';
        return html.replace("<!-- INVENTORY_ITEMS -->", inventory);
    }

    /* ------------------------------------------- */

    _buildSpellbook(html, data) {
        let spellbook = "",
            spellHeader = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/items/spell-header.html'),
            spellTemplate = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/items/spell.html');
        $.each(data.spellbook, function(l, level){
            let page = FTC.populateTemplate(spellHeader, level),
                spells = "";
            $.each(level.spells, function(_, spell){
                spells += FTC.populateTemplate(spellTemplate, spell.data);
            });
            spellbook += page.replace("<!-- SPELLS -->", spells);
        });
        spellbook = spellbook || '<blockquote class="compendium">Add spells from the compendium.</blockquote>';
        return html.replace("<!-- SPELLBOOK_SPELLS -->", spellbook);
    }

    /* ------------------------------------------- */

    _buildFeats(html, data) {
        let feats = "",
            featTemplate = FTC.loadTemplate(FTC.TEMPLATE_DIR + 'character/items/feat.html');
        $.each(data.feats, function(i, item) {
            item.data.itemid = i;
            feats += FTC.populateTemplate(featTemplate, item.data);
        });
        feats = feats || '<blockquote class="compendium">Add feats from the compendium.</blockquote>';
        return html.replace("<!-- FEATS_LIST -->", feats);
    }

    /* ------------------------------------------- */

    activateListeners(html, app, scope) {
        const self = this;

        // Activate Tabs and Editable Fields
        FTC.ui.activateTabs(html, this, app);
        FTC.forms.activateFields(html, this, app);

        // Activate rollable actions on a timeout to prevent accidentally clicking immediately when the sheet opens
        setTimeout(function() {

            // Attribute rolls
            html.find('.ability .ftc-rollable').click(function() {
                let attr = $(this).parent().attr("data-ability");
                self.rollAbility(attr);
            });

            // Skill rolls
            html.find('.skill .ftc-rollable').click(function() {
                let skl = $(this).parent().attr("data-skill");
                self.rollSkillCheck(skl);
            });

            // Weapon actions
            html.find(".weapon .ftc-rollable").click(function() {
                const itemId = $(this).closest("li.weapon").attr("data-item-id"),
                    itemData = self.data.inventory[itemId];
                FTCItemAction.toChat(self, itemData);
            });

            // Spell actions
            html.find(".spell .ftc-rollable").click(function() {
                const itemId = $(this).closest("li.spell").attr("data-item-id"),
                    itemData = self.data.spellbook[itemId];
                FTCItemAction.toChat(self, itemData);
            });

            // Feat actions
            html.find(".feat .ftc-rollable").click(function() {
                const itemId = $(this).closest("li.feat").attr("data-item-id"),
                    itemData = self.data.feats[itemId];
                FTCItemAction.toChat(self, itemData);
            });

            // Dragable items
            html.find(".item-list").sortable({
                "items": " > li",
                "cancel": ".inventory-header",
                "containment": "parent",
                "axis": "y",
                "opacity": 0.75,
                "delay": 200,
                "scope": $(this).attr("data-item-container"),
                "update": function( event, ui ) {
                    let container = ui.item.parent().attr("data-item-container");
                    self.getSortOrder(container, ui.item);
                }
            });
        }, 500);
    }

    /* ------------------------------------------- */

    getSortOrder(container, li) {
        let parent = undefined;
        if ( li ) {
            parent = li.parents("." + container);
        } else if ( this.app ) {
            parent = this.app.find("." + container);
        }

        // Check the current sort order
        let sorted = [];
        parent.find("li.item").each(function() {
            sorted.push($(this).attr("data-item-id"));
        });

        // Update sorting
        this._sorting[container] = sorted;
        this._changed = true;
        return sorted;
    }

    /* ------------------------------------------- */
    /* Owned Items                                 */
    /* ------------------------------------------- */

    addItem(item, container) {
        const type = item.type;
        if ( !container ) {
            if (["weapon", "armor", "item"].includes(type)) container = "inventory";
            else if ("spell" === type) container = "spellbook";
            else if ("feat" === type) container = "feats";
        }
        if ( !container ) return;

        // If we are dropping a spell on the inventory tab, it's a "Scroll of ___"
        if ( type === "spell" && FTC.character.data.tabs["content-tabs"] === "tab-inventory" ) {
            item.data.info.name.current = "Scroll of " + item.data.info.name.current;
            item.data.info.type.current = item.types.ITEM_TYPE_DEFAULT;
            item.data.info.variety.current = "consumable";
            container = "inventory";
        }

        // Push the item in
        let newId = this.data[container].length;
        this.data[container].push(item.data);

        // Add the item to pending sort
        if ( this._sorting[container].length ) this._sorting[container].push(newId);
        this._changed = true;
        this.save();
    }

    /* ------------------------------------------- */

    updateItem(container, itemId, itemData) {
        this.data[container][itemId] = itemData;
        this._changed = true;
        this.save();
    }

    /* ------------------------------------------- */

    deleteItem(container, itemId) {
        this.data[container].splice(itemId, 1);
        let sortIndex = this.data[container].indexOf(itemId + "");
        this._sorting[container].splice(sortIndex, 1);
        this._changed = true;
    }

    /* ------------------------------------------- */
    /* Character Actions                           */
    /* ------------------------------------------- */

    rollAbility(attr) {
        /* Initial dialog to prompt between rolling an Ability Test or Saving Throw
        */

        const actor = this;
        const html = $('<div id="ftc-dialog"><p>What type of roll?</p></div>');

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: actor.data.stats[attr].name + " Roll",
            buttons: {
                "Ability Test": function () {
                    $(this).dialog("close");
                    $(this).dialog("destroy");
                    actor.rollAbilityTest(attr);
                },
                "Saving Throw": function () {
                    $(this).dialog("close");
                    $(this).dialog("destroy");
                    actor.rollAbilitySave(attr);
                }
            }
        });
    }

    /* -------------------------------------------- */

    rollAbilityTest(attr) {
        /* Roll an Attribute Test
        */

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            name = data[attr].name,
            flavor = name + " Test",
            rolled = false,
            adv = undefined,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="ability-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: {
                "Advantage": function () {
                    rolled = true;
                    adv = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Disadvantage": function () {
                    rolled = true;
                    adv = false;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            },
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                let formula = FTC.Dice.formula(FTC.Dice.d20(adv), "@mod", bonus);
                if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data[attr].mod});
            }
        });
    }

    /* -------------------------------------------- */

    rollAbilitySave(attr) {
        /* Roll a Saving Throw
        */

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            name = data[attr].name,
            flavor = name + " Save",
            rolled = false,
            adv = undefined,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="ability-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: {
                "Advantage": function () {
                    rolled = true;
                    adv = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Disadvantage": function () {
                    rolled = true;
                    adv = false;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            },
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                let formula = FTC.Dice.formula(FTC.Dice.d20(adv), "@mod", "@prof", bonus);
                if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data[attr].mod, "prof": data[attr].prof});
            }
        });
    }

    /* -------------------------------------------- */

    rollSkillCheck(skl) {
        /* Roll a skill check, prompting for advantage/disadvantage as well as situational modifiers
        */

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            name = data[skl].name,
            flavor = name + " Check",
            rolled = false,
            adv = undefined,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="skill-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: {
                "Advantage": function () {
                    rolled = true;
                    adv = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Disadvantage": function () {
                    rolled = true;
                    adv = false;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            },
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                let formula = FTC.Dice.formula(FTC.Dice.d20(adv), "@mod", "@prof", bonus);
                if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data[skl].mod, "prof": data[skl].prof});
            }
        });
    }

    /* -------------------------------------------- */

    rollWeaponAttack(flavor, hit) {
        /* Roll a weapon attack, prompting for advantage/disadvantage as well as situational bonuses
        */

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            rolled = false,
            adv = undefined,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="attack-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Attack With advantage?</label>'));

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: {
                "Advantage": function () {
                    rolled = true;
                    adv = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Disadvantage": function () {
                    rolled = true;
                    adv = false;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            },
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                let formula = FTC.Dice.formula(FTC.Dice.d20(adv), hit, "@mod", "@prof", bonus);
                if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data.weaponMod, "prof": data.proficiency});
            }
        });
    }

    /* -------------------------------------------- */

    rollWeaponDamage(flavor, damage) {

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            rolled = false,
            crit = false,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="attack-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Was your attack a critical hit?</label>'));

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: {
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Critical Hit!": function () {
                    rolled = true;
                    crit = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            },
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                damage = crit ? FTC.Dice.crit(damage) : damage;
                bonus = crit ? FTC.Dice.crit(bonus) : bonus;
                let formula = FTC.Dice.formula(damage, "@mod", bonus);
                flavor += crit ? " (Critical Hit)" : "";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data.weaponMod});
            }
        });
    }

    /* -------------------------------------------- */

    rollSpellAttack(flavor) {
        /*
        Roll a spell attack, prompting for advantage/disadvantage as well as situational bonuses
        */

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            rolled = false,
            adv = undefined,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="attack-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Attack With advantage?</label>'));

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: {
                "Advantage": function () {
                    rolled = true;
                    adv = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Disadvantage": function () {
                    rolled = true;
                    adv = false;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            },
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                let formula = FTC.Dice.formula(FTC.Dice.d20(adv), "@mod", "@prof", bonus);
                if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data.spellMod, "prof": data.proficiency});
            }
        });
    }

    /* -------------------------------------------- */

    rollSpellDamage(flavor, damage, canCrit) {

        // Prepare core data
        let actor = this,
            data = this.getCoreData(),
            buttons = {},
            rolled = false,
            crit = false,
            bonus = undefined;

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="attack-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));

        // Some spells cannot critically hit, so they should just roll directly
        if ( canCrit ) {
            buttons = {
                "Normal": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                },
                "Critical Hit!": function () {
                    rolled = true;
                    crit = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            };
            html.append($('<label>Was your attack a critical hit?</label>'));
        } else {
            buttons = {
                "Roll Damage": function () {
                    rolled = true;
                    bonus = $(this).find('#roll-bonus').val();
                    $(this).dialog("close");
                }
            };
        }

        // Create a dialogue
        FTC.ui.createDialogue(html, {
            title: flavor,
            buttons: buttons,
            close: function () {
                html.dialog("destroy");
                if ( !rolled ) return;
                damage = crit ? FTC.Dice.crit(damage) : damage;
                bonus = crit ? FTC.Dice.crit(bonus) : bonus;
                let formula = FTC.Dice.formula(damage, bonus);
                flavor += crit ? " (Critical Hit)" : "";
                FTC.Dice.roll(actor, flavor, formula, {"mod": data.spellMod});
            }
        });
    }
}


/* -------------------------------------------- */
/* Character Sheet Sync Render                  */
/* -------------------------------------------- */

sync.render("FTC_CHARSHEET", function (obj, app, scope) {
    if ( game.templates.identifier !== FTC_SYSTEM_IDENTIFIER ) {
        return $("<div>Sorry, no preview available at the moment.</div>");
    }
    const char = new FTCCharacter(obj);
    return char.renderHTML(app, scope);
});

