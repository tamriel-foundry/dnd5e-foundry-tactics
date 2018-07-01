hook.add("FTCInit", "Actions", function() {
FTC.actions = {

    /* A generic d20 forumla which toggles advantage/disadvantage */
    _roll_advantage:function(advantage) {
        var formula = "$die=d20; 1d20";    // Normal - roll 1d20
        if (advantage === "adv") {
            formula = "$die=d20; 2d20dl1" // Advantage - roll 2d20, drop lowest
        }
        else if (advantage === "dis") {
            formula = "$die=d20; 2d20dh1" // Disadvantage - roll 2d20, drop highest
        }
        return formula;
    },

    /* Generic dice roller which hooks into the query API */
    _roll_dice:function(obj, message, formula, data) {
        var eventData = {
            'f': obj.data.info.name.current,
            'msg': message,
            'icon': obj.data.info.img.current,
            'data': sync.executeQuery(formula, data)
        };
        runCommand("diceCheck", eventData);
        snd_diceRoll.play();
    },

    /* -------------------------------------------- */
    /* Attribute Rolls                              */
    /* -------------------------------------------- */

    attribute_actions:function(html, obj, app) {
        html.find('.attribute .ftc-rollable').click(function() {
            FTC.actions.roll_attribute(obj, $(this).parent().attr("data-attribute"));
        });
    },

    /* API Call to roll attribute checks and saving throws */
    roll_attribute:function(obj, attr) {
        var name = obj.data.stats[attr].name;

        // Inner Dialogue HTML
        var html = ($('<div class="attribute-roll"></div>'))
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create Outer Dialogue
        FTC.ui._create_dialogue("Roll " + obj.data.stats[attr].name, "What type of roll?", {

            /* Path 1: Attribute Check */
            "Attribute Check": function(){
                $(this).dialog("close");
                FTC.ui._create_dialogue(name + " Attribute Check", html, {
                    "Advantage": function(){
                        $(this).dialog("close");
                        FTC.actions._roll_attribute_test(obj, attr, "adv", $(this).find('#roll-bonus').val());
                    },
                    "Normal": function(){
                        $(this).dialog("close");
                        FTC.actions._roll_attribute_test(obj, attr, "normal", $(this).find('#roll-bonus').val());
                    },
                    "Disadvantage": function(){
                        $(this).dialog("close");
                        FTC.actions._roll_attribute_test(obj, attr, "dis", $(this).find('#roll-bonus').val());
                    }
                });
            },

            /* Path 2: Saving Throw */
            "Saving Throw": function(){
                $(this).dialog("close");
                FTC.ui._create_dialogue(name + " Saving Throw", html, {
                    "Advantage": function(){
                        $(this).dialog("close");
                        FTC.actions._roll_saving_throw(obj, attr, "adv", $(this).find('#roll-bonus').val());
                    },
                    "Normal": function(){
                        $(this).dialog("close");
                        FTC.actions._roll_saving_throw(obj, attr, "normal", $(this).find('#roll-bonus').val());
                    },
                    "Disadvantage": function(){
                        $(this).dialog("close");
                        FTC.actions._roll_saving_throw(obj, attr, "dis", $(this).find('#roll-bonus').val());
                    }
                });
            },
        });
    },

    /* Roll an attribute test */
    _roll_attribute_test: function(obj, attr, adv, bonus) {
        let formula = this._roll_advantage(adv) + " + @mod " + (bonus || ""),
        advstr = ((adv === "adv") ? " (Advantage)" : "") + ((adv === "dis") ? " (Disadvantage)" : ""),
        message = obj.data.stats[attr].name + " Check" + advstr,
        data = {'mod': obj.data.ftc[attr].mod};
        this._roll_dice(obj, message, formula, data);
    },

    /* Roll a saving throw */
    _roll_saving_throw:function(obj, attr, adv, bonus) {
        let formula = this._roll_advantage(adv) + " + @mod " + (bonus || ""),
        advstr = ((adv === "adv") ? " (Advantage)" : "") + ((adv === "dis") ? " (Disadvantage)" : ""),
        message = obj.data.stats[attr].name + " Save" + advstr,
        data = {'mod': obj.data.ftc[attr].svmod};
        this._roll_dice(obj, message, formula, data);
    },

    /* -------------------------------------------- */
    /* Skill Rolls                                */ 
    /* -------------------------------------------- */

    skill_actions:function(html, obj, app) {
        html.find('.skill .ftc-rollable').click(function() {
            FTC.actions.roll_skill(obj, $(this).parent().attr("id"));
        });
    },

    /* API Call to roll attribute checks and saving throws */
    roll_skill:function(obj, skl) {

        // Dialogue HTML
        var html = ($('<div class="attribute-roll"></div>'))
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create Dialogue with Response Buttons
        FTC.ui._create_dialogue(obj.data.skills[skl].name + " Skill Check", html, {
            "Advantage": function(){
                $(this).dialog("close");
                FTC.actions._roll_skill_check(obj, skl, "adv", $(this).find('#roll-bonus').val());
            },
            "Normal": function(){
                $(this).dialog("close");
                FTC.actions._roll_skill_check(obj, skl, "normal", $(this).find('#roll-bonus').val());
            },
            "Disadvantage": function(){
                $(this).dialog("close");
                FTC.actions._roll_skill_check(obj, skl, "dis", $(this).find('#roll-bonus').val())
            }
        });
    },

    /* Roll a skill check */
    _roll_skill_check:function(obj, skl, adv, bonus) {
        var bonus = bonus || "";
        var formula = this._roll_advantage(adv) + " + @mod " + bonus,
               name = obj.data.skills[skl].name;
            message = name + " Check" + ((adv === "adv") ? " (Advantage)" : "") + ((adv === "dis") ? " (Disadvantage)" : ""),
               data = {'mod': obj.data.ftc[skl].mod};
        this._roll_dice(obj, message, formula, data);
    },

    /* -------------------------------------------- */
    /* Item, Spell, and Ability Actions             */
    /* -------------------------------------------- */

    item_actions:function(html, owner, app) {

        // Weapons from Inventory
        html.find(".weapon .ftc-rollable").click(function() {
            let itemId = $(this).closest("li.weapon").attr("data-item-id");
            FTCWeaponAction.diceCheck(owner, itemId, FTCWeaponAction.ui);
        });

        // Spells from Spellbook
        html.find(".spell .ftc-rollable").click(function() {
            let itemId = $(this).closest("li.spell").attr("data-item-id");
            FTCSpellAction.diceCheck(owner, itemId, FTCSpellAction.ui);
        });

        // Abilities
        html.find(".ability .ftc-rollable").click(function() {
           let itemId = $(this).closest("li.ability").attr("data-item-id");
           FTCAbilityAction.diceCheck(owner, itemId, FTCAbilityAction.ui);
        });
    },

    /* -------------------------------------------- */

    /* Get exp rules */
    get_next_level_exp:function(level) {
        levels = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 
                  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
        return levels[Math.min(level, levels.length - 1)];
    },

    /* -------------------------------------------- */

    activateActions: function(html, character, app) {
        this.attribute_actions(html, character.obj, app);
        this.skill_actions(html, character.obj, app);
        this.item_actions(html, character.obj, app);
    }
};


/* -------------------------------------------- */
/*  ABSTRACT ITEM ACTION                        */
/* -------------------------------------------- */


class FTCItemAction extends FTCItem {

    static diceCheck(owner, itemId, ui) {
        // Trigger a dice check using this static factory method

        // Generate event data
        let eventData = {
            "f": owner.data.info.name.current,
            "href": owner.data.info.img.current,    // This is inconsistent, similar to "icon" for other events
            "ui": ui,
            "owner": owner,
            "itemId": itemId
        };

        // Submit the chat event
        runCommand("chatEvent", eventData);
    }

    get parts() {
        return [];
    }

    /* -------------------------------------------- */

    activateEventListeners(html) {
        let owner = this.owner,
            name = this.data.info.name.current;

        // Prevent click actions
        html.click(function(ev) {
           ev.preventDefault();
           ev.stopPropagation();
        });

        // Add roll actions
        html.find("h3.action-roll").click(function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            FTC.actions._roll_dice(owner, name+" "+$(this).attr("title"), $(this).attr("data-formula"), {});
        });
        return html;
    }
}


/* -------------------------------------------- */
/* Weapon Attack Action                         */
/* -------------------------------------------- */


class FTCWeaponAction extends FTCItemAction {

    static get ui() {
        return "FTC_WEAPON_ACTION";
    }

    get template() {
        return FTC.TEMPLATE_DIR + "actions/action-weapon.html";
    }

    /* -------------------------------------------- */

    getVarietyStr(v) {
        let vars = {
            "simplem": "Simple Martial",
            "simpler": "Simple Ranged",
            "martialm": "Martial Melee",
            "martialr": "Martial Ranged",
            "natural": "Natural",
            "improv": "Improvised",
            "ammo": "Ammunition"
        }
        return vars[v];
    }

    /* -------------------------------------------- */

    enrichData(data) {

        // Temporary data
        data.ftc = data.ftc || {};

        // Construct weapon properties
        const props = [
            this.getVarietyStr(data.info.variety.current),
            data.weapon.range.current,
            data.weapon.properties.current,
            data.weapon.proficient ? "Proficient" : "Not Proficient"
        ];
        let propStr = "";
        $.each(props, function(_, p) {
            if (p) propStr += `<span class="action-prop">${p}</span>`;
        });
        data.ftc["actionProps"] = propStr;

        // Populate weapon attack rolls
        data = this.weaponAttacks(data);
        return data;
    }

    /* -------------------------------------------- */

    weaponAttacks(data) {
        // Populate additional scope-dependent context data

        // Check permissions
        let weapon = data.weapon,
            canRoll = hasSecurity(getCookie("UserID"), "Owner", this.owner.data);
        if ( !canRoll ) return;

        // General data
        let attr = this.owner.data.info.offensive.current || "Str",
            prof = this.owner.data.counters.proficiency.current,
            mod = this.owner.data.stats[attr].modifiers.mod;

        // Weapon Attack Roll
        let bonus = parseInt(weapon.hit.current) || 0,
            fml = `d20 + ${bonus} + ${prof} + ${mod}`,
            hit = `<h3 class="action-roll weapon-hit" title="Weapon Attack" data-formula="${fml}">Weapon Attack</h3>`;
        data.ftc.weaponHit = hit;

        // Weapon Damage Roll
        let dam = data.weapon.damage.current,
            d2 = data.weapon.damage2.current;
        dam = ( d2 ) ? dam+" + "+d2 : dam;
        fml = `${dam} + ${mod}`;
        let damage = `<h3 class="action-roll weapon-hit" title="Weapon Damage" data-formula="${fml}">Weapon Damage</h3>`;
        data.ftc.weaponDamage = damage;
        return data;
    }
}


sync.render(FTCWeaponAction.ui, function(obj, app, scope) {
    let item = obj.owner.data.inventory[obj.itemId],
        action = new FTCWeaponAction(item, app, {"owner": obj.owner});
    return action.renderHTML();
});


/* -------------------------------------------- */
/* Spell Cast Item Action                       */
/* -------------------------------------------- */


class FTCSpellAction extends FTCItemAction {

    static get ui() {
        return "FTC_SPELL_ACTION";
    }

    get template() {
        return FTC.TEMPLATE_DIR + "actions/action-spell.html";
    }

    /* -------------------------------------------- */

    enrichData(data) {

        // Temporary FTC display data
        data.ftc = data.ftc || {};

        // Construct spell properties HTML
        let spell = data.spell;
        const props = [
            (spell.level.current === 0) ? "Cantrip" : spell.level.current.ordinalString() + " Level",
            spell.school.current.capitalize(),
            spell.time.current.titleCase(),
            data.weapon.range.current,
            spell.duration.current,
            spell.components.current,
            (spell.ritual.current) ? "Ritual" : undefined,
            (spell.concentration.current) ? "Concentration" : undefined
        ];
        let propStr = "";
        $.each(props, function(_, p) {
            if (p) propStr += `<span class="action-prop">${p}</span>`;
        });
        data.ftc["actionProps"] = propStr;

        // Populate spell attack rolls
        data = this.spellAttacks(data);
        return data;
    }

    /* -------------------------------------------- */

    spellAttacks(data) {
        // Populate additional scope-dependent context data

        // Check permissions
        let spell = data.spell,
            canRoll = hasSecurity(getCookie("UserID"), "Owner", this.owner.data);

        // General data
        let attr = this.owner.data.info.spellcasting.current || "Int",
            prof = this.owner.data.counters.proficiency.current,
            mod = this.owner.data.stats[attr].modifiers.mod,
            dc = 8 + mod + prof;

        // Spell Attack Roll
        if (data.info.variety.current === "attack" && canRoll) {
                let fml = `d20 + ${prof} + ${mod}`,
                hit = `<h3 class="action-roll spell-hit" title="Spell Attack" data-formula="${fml}">Spell Attack</h3>`;
            data.ftc.spellHit = hit;
        }

        // Spell Save
        if (data.info.variety.current === "save") {
            data.ftc.spellDC = `<h3 class="spell-dc" title="Spell DC">Spell DC ${dc}</h3>`;
        }

        // Spell Damage
        if (data.weapon.damage.current && canRoll) {
            let fml = data.weapon.damage.current,
                title = (data.weapon.damage.type === "healing") ? "Spell Healing" : "Spell Damage",
                atk = `<h3 class="action-roll spell-damage" title="${title}" data-formula="${fml}">${title}</h3>`;
            data.ftc.spellDamage = atk;
        }
        return data;
    }
}


sync.render(FTCSpellAction.ui, function(obj, app, scope) {
    let spell = obj.owner.data.spellbook[obj.itemId],
        action = new FTCSpellAction(spell, app, {"owner": obj.owner});
    return action.renderHTML();
});


/* -------------------------------------------- */
/* Ability Item Action                          */
/* -------------------------------------------- */


class FTCAbilityAction extends FTCItemAction {

    static get ui() {
        return "FTC_ABILITY_ACTION";
    }

    get template() {
        return FTC.TEMPLATE_DIR + "actions/action-ability.html";
    }

    /* -------------------------------------------- */

    enrichData(data) {

        // Temporary data
        data.ftc = data.ftc || {};

        // Construct spell properties HTML
        const props = [
            data.info.variety.current.capitalize() + ": " + data.info.requirements.current.capitalize(),
            data.spell.time.current.titleCase(),
            data.spell.materials.current,
            data.info.source.current
        ];
        let propStr = "";
        $.each(props, function(_, p) {
            if (p) propStr += `<span class="action-prop">${p}</span>`;
        });
        data.ftc["actionProps"] = propStr;
        return data;
    }
}


sync.render(FTCAbilityAction.ui, function(obj, app, scope) {
    let item = obj.owner.data.abilities[obj.itemId],
        action = new FTCAbilityAction(item, app, {"owner": obj.owner});
    return action.renderHTML();
});


// End FTCInit
});