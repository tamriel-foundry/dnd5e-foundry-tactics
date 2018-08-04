



FTCWeapon.prototype.chatAction = function() {
    /*
    Generic wrapper for element chat actions. Relies on each element to define a chatUI attribute.
    */

    // Disallow chat actions for unowned items
    if ( !this.owner ) return;

    // Prepare core data
    const owner = this.owner;
    const self = this;
    const ownerData = owner.getCoreData(owner.data);

    // Combine data object
    console.log(ownerData);
};




FTCWeapon.prototype.attackRoll = function() {
    /*
    Roll a weapon attack, prompting for advantage/disadvantage for a weapon owned by a character.
    */

    if ( !this.owner ) return;

    // Prepare core data
    const owner = this.owner,
        ownerData = owner.getCoreData(owner.data),
        weapon = this;

    // Placeholder flags
    let rolled = false,
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
};




