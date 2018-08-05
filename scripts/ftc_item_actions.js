
FTCItemActions = {

    /* -------------------------------------------- */
    /*  WEAPON ACTIONS                              */
    /* -------------------------------------------- */

    weaponAttack: function(button) {

        // Get data
        let rolled = false,
            adv = undefined,
            bonus = undefined,
            flavor = button.attr("title");

        // Get the actor
        let entID = button.parents(".ftc-chat").attr("data-ent");
        if ( !entID ) {
            button.removeClass("rollable");
            return;
        }7
        let actor = new FTCActor(getEnt(entID));

        // Roll data
        let rollData = {
            "hit": button.attr("data-hit"),
            "mod": button.attr("data-mod"),
            "prof": button.attr("data-prof")
        };

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
                if (!rolled) return;
                let formula = FTC.Dice.formula(FTC.Dice.d20(adv), "@hit", "@mod", "@prof", bonus);
                if (adv !== undefined) flavor += ( adv ) ? " (Advantage)" : " (Disadvantage)";
                FTC.Dice.roll(actor, flavor, formula, rollData);
            }
        });
    },

    /* -------------------------------------------- */

    weaponDamage: function(button) {

        // Get data
        let rolled = false,
            flavor = button.attr("title"),
            crit = false,
            bonus = undefined;

        // Get the actor
        let entID = button.parents(".ftc-chat").attr("data-ent");
        if ( !entID ) {
            button.removeClass("rollable");
            return;
        }
        let actor = new FTCActor(getEnt(entID));

        // Roll data
        let mod = button.attr("data-mod");
        let dam = button.attr("data-dam");

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
                dam = crit ? FTC.Dice.crit(dam) : dam;
                bonus = crit ? FTC.Dice.crit(bonus) : bonus;
                let formula = FTC.Dice.formula(dam, "@mod", bonus);
                flavor += crit ? " (Critical Hit)" : "";
                FTC.Dice.roll(actor, flavor, formula, {"mod": mod});
            }
        });
    },

    /* -------------------------------------------- */

    spellAttack: function(button) {

        // Prepare core data
        let rolled = false,
            adv = undefined,
            bonus = undefined,
            flavor = button.attr("title");

        // Get the actor
        let entID = button.parents(".ftc-chat").attr("data-ent");
        if ( !entID ) {
            button.removeClass("rollable");
            return;
        }
        let actor = new FTCActor(getEnt(entID));

        // Roll data
        let rollData = {
            "mod": button.attr("data-mod"),
            "prof": button.attr("data-prof")
        };

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
                FTC.Dice.roll(actor, flavor, formula, rollData);
            }
        });
    },

    /* -------------------------------------------- */

    spellDamage: function(button) {

        // Get data
        let rolled = false,
            flavor = button.attr("title"),
            crit = false,
            bonus = undefined;

        // Get the actor
        let entID = button.parents(".ftc-chat").attr("data-ent");
        if ( !entID ) {
            button.removeClass("rollable");
            return;
        }
        let actor = new FTCActor(getEnt(entID));

        // Roll data
        let dam = button.attr("data-dam"),
            mod = button.attr("data-mod"),
            canCrit = button.attr("data-crit");

        // Prepare HTML form
        const html = $('<div id="ftc-dialog" class="attack-roll"></div>');
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));

        // Some spells cannot critically hit, so they should just roll directly
        let buttons = {};
        if ( canCrit ) {
            html.append($('<label>Was your attack a critical hit?</label>'));
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
                dam = crit ? FTC.Dice.crit(dam) : dam;
                bonus = crit ? FTC.Dice.crit(bonus) : bonus;
                let formula = FTC.Dice.formula(dam, bonus);
                flavor += crit ? " (Critical Hit)" : "";
                FTC.Dice.roll(actor, flavor, formula, {"mod": mod});
            }
        });
    }
};

/* -------------------------------------------- */


hook.add("FTCInit", "ItemActions", function() {
    sync.render("FTC_ITEM_ACTION", function(obj, app, scope) {
        const chatData = obj.chatData;
        const cls = FTCElement.getElement(chatData._type);
        return cls.renderChatHTML(chatData);
    });
});


/* -------------------------------------------- */



