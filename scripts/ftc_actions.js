hook.add("FTCInit", "Actions", function() {
FTC.actions = {

    /* -------------------------------------------- */

    /* Get exp rules */
    get_next_level_exp:function(level) {
        levels = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
                  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
        return levels[Math.min(level, levels.length - 1)];
    },

    /* -------------------------------------------- */
    /* Attribute Rolls                              */
    /* -------------------------------------------- */

    /* API Call to roll attribute checks and saving throws */
    roll_attribute:function(dice, attr) {

        // Get the skill name
        let name = game.templates.character.stats[attr].name;

        // Inner Dialogue HTML
        var html = ($('<div class="attribute-roll"></div>'))
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create Outer Dialogue
        FTC.ui._create_dialogue(name + " Check", "What type of roll?", {

            /* Path 1: Attribute Check */
            "Attribute Test": function(){
                $(this).dialog("close");
                FTC.ui._create_dialogue(name + " Attribute Test", html, {
                    "Advantage": function(){
                        $(this).dialog("close");
                        dice.rollAttributeTest(attr, true, $(this).find('#roll-bonus').val(), true);
                    },
                    "Normal": function(){
                        $(this).dialog("close");
                        dice.rollAttributeTest(attr, $(this).find('#roll-bonus').val());
                    },
                    "Disadvantage": function(){
                        $(this).dialog("close");
                        dice.rollAttributeTest(attr, $(this).find('#roll-bonus').val(), false);
                    }
                });
            },

            /* Path 2: Saving Throw */
            "Saving Throw": function(){
                $(this).dialog("close");
                FTC.ui._create_dialogue(name + " Saving Throw", html, {
                    "Advantage": function(){
                        $(this).dialog("close");
                        dice.rollAttributeSave(attr, $(this).find('#roll-bonus').val(), true);
                    },
                    "Normal": function(){
                        $(this).dialog("close");
                        dice.rollAttributeSave(attr, $(this).find('#roll-bonus').val());
                    },
                    "Disadvantage": function(){
                        $(this).dialog("close");
                        dice.rollAttributeSave(attr, $(this).find('#roll-bonus').val(), false);
                    }
                });
            },
        });
    },

    /* -------------------------------------------- */
    /* Skill Rolls                                */ 
    /* -------------------------------------------- */

    /* API Call to roll attribute checks and saving throws */
    roll_skill:function(dice, skill) {

        // Get the skill name
        let name = game.templates.character.skills[skill].name;

        // Dialogue HTML
        var html = ($('<div class="attribute-roll"></div>'))
        html.append($('<label>Situational Modifier?</label>'));
        html.append($('<input type="text" id="roll-bonus" placeholder="Formula"/>'));
        html.append($('<label>Roll With advantage?</label>'));

        // Create Dialogue with Response Buttons
        FTC.ui._create_dialogue(name + " Skill Check", html, {
            "Advantage": function(){
                $(this).dialog("close");
                dice.rollSkillCheck(skill, $(this).find('#roll-bonus').val(), true);
            },
            "Normal": function(){
                $(this).dialog("close");
                dice.rollSkillCheck(skill, $(this).find('#roll-bonus').val());
            },
            "Disadvantage": function(){
                $(this).dialog("close");
                dice.rollSkillCheck(skill, $(this).find('#roll-bonus').val(), false);
            }
        });
    },

    /* -------------------------------------------- */

    activateActions: function(html, character, app) {

        // Attribute rolls
        html.find('.attribute .ftc-rollable').click(function() {
            FTC.actions.roll_attribute(character.dice, $(this).parent().attr("data-attribute"));
        });

        // Skill rolls
        html.find('.skill .ftc-rollable').click(function() {
            FTC.actions.roll_skill(character.dice, $(this).parent().attr("id"));
        });

        // Weapon actions
        html.find(".weapon .ftc-rollable").click(function() {
            const itemId = $(this).closest("li.weapon").attr("data-item-id"),
                itemData = character.data.inventory[itemId];
            FTCItemAction.toChat(character, itemData);
        });

        // Spell actions
        html.find(".spell .ftc-rollable").click(function() {
            const itemId = $(this).closest("li.spell").attr("data-item-id"),
                itemData = character.data.spellbook[itemId];
            FTCItemAction.toChat(character, itemData);
        });

        // Ability actions
        html.find(".ability .ftc-rollable").click(function() {
            const itemId = $(this).closest("li.ability").attr("data-item-id"),
                itemData = character.data.abilities[itemId];
            FTCItemAction.toChat(character, itemData);
        });
    }
};

// End FTCInit
});