
FTCActor.prototype.rollAbility = function(ability) {
    /*
    Entry level wrapper for rolling Ability Tests or Saving Throws
    */

    const actor = this;
    const html = $('<div id="ftc-dialog"><p>What type of roll?</p></div>');

    // Create a dialogue
    FTC.ui.createDialogue(html, {
        title: actor.data.abilities[ability].name + " Roll",
        buttons: {
            "Ability Test": function () {
                $(this).dialog("close");
                $(this).dialog("destroy");
                actor.abilityTest(ability);
            },
            "Saving Throw": function () {
                $(this).dialog("close");
                $(this).dialog("destroy");
                actor.abilitySave(ability);
            }
        }
    });
};


/* -------------------------------------------- */


FTCActor.prototype.abilityTest = function(ability) {
    /*
    Roll an Ability Test
    d20 + modifier + situational
    */

    // Prepare core data
    let actor = this,
        data = this.getCoreData(this.data),
        a = data.abilities[ability],
        flavor = a.name + " Test",
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
            FTC.Dice.roll(actor, flavor, formula, {"mod": a.mod});
        }
    });
};


/* -------------------------------------------- */


FTCActor.prototype.abilitySave = function(ability) {
    /*
    Roll an Ability Saving Throw
    d20 + mod + proficiency + situational
    */

    // Prepare core data
    let actor = this,
        data = this.getCoreData(this.data),
        a = data.abilities[ability],
        flavor = a.name + " Save",
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
            FTC.Dice.roll(actor, flavor, formula, {"mod": a.mod, "prof": a.prof});
        }
    });
};


/* -------------------------------------------- */


FTCActor.prototype.rollSkill = function(skill) {
    /* 
    Roll a skill check, prompting for advantage/disadvantage as well as situational modifiers
    d20 + ability mod + proficiency + situational
    */

    // Prepare core data
    let actor = this,
        data = this.getCoreData(this.data),
        s = data.skills[skill],
        flavor = s.name + " Check",
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
            FTC.Dice.roll(actor, flavor, formula, {"mod": s.mod, "prof": s.prof});
        }
    });
};


/* -------------------------------------------- */
