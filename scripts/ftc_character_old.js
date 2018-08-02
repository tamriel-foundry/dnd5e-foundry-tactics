
/* ------------------------------------------- */
/* Character Object Type                       */
/* ------------------------------------------- */

class FTCCharacterOld extends FTCEntity {

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

    getCoreData(data) {
        /* This function exists to prepare all the standard rules data that would be used by dice rolling in D&D5e.
        */


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
