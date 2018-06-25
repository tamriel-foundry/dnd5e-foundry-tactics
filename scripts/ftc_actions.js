hook.add("FTCInit", "Actions", function() {
FTC.actions = {

	/* A generic d20 forumla which toggles advantage/disadvantage */
	_roll_advantage:function(advantage) {
		var formula = "$die=d20; 1d20";	// Normal - roll 1d20
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
		}
		runCommand("diceCheck", eventData);
		snd_diceRoll.play();
	},

	/* -------------------------------------------- */
	/* Attribute Rolls								*/ 
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
	/* Skill Rolls								*/ 
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

	/* Get exp rules */
	get_next_level_exp:function(level) {
		levels = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 
				  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
		return levels[Math.min(level, levels.length - 1)];
	}

	/* -------------------------------------------- */
};




/* -------------------------------------------- */
/* Spell Cast Chat Render			            */
/* -------------------------------------------- */

class FTCSpellAction extends FTCObject {

    constructor(obj, app, scope) {
        super(obj, app, scope);
        this.spellAttacks();
        this.template = FTC.TEMPLATE_DIR + 'items/action-spell.html';
        this.flavors = [
            "Invokes arcane energy",
            "Focuses intently",
            "Steels in concentration",
            "Prepares an incantation",
            "Summons mystical power",
            "Unleashes inner power",
        ];
    }

    /* -------------------------------------------- */

    static enrichData(data) {
        let spell = data.spell;
        data.ftc = {};

        // Construct spell properties HTML
        const props = [
            (spell.level.current === 0) ? "Cantrip" : FTC.ui.getOrdinalNumber(spell.level.current) + " Level",
            spell.school.current.capitalize(),
            spell.time.current.titleCase(),
            spell.duration.current,
            spell.components.current,
            (spell.ritual.current) ? "Ritual" : undefined,
            (spell.concentration.current) ? "Concentration" : undefined
        ];
        let propStr = "";
        $.each(props, function(_, p) {
            if (p) propStr += `<span class="spell-prop">${p}</span>`;
        });
        data.ftc["spellProps"] = propStr;
        return data;
    }

    /* -------------------------------------------- */

    renderHTML() {
        let html = FTC.loadTemplate(this.template);
        html = FTC.populateTemplate(html, this.data);
        return html;
    }

    /* -------------------------------------------- */

    spellAttacks() {
        let data = this.data,
            spell = data.spell,
            owner = this.scope.owner;

        // Spell Saves
        if (data.info.variety.current === "save") {
            let dc = owner.data.ftc.spellDC,
                fml = data.weapon.damage.current,
                atk = `<h3 class="spell-roll spell-dc" title="Roll Damage" data-formula="${fml}">Spell DC ${dc}</h3>`;
            data.ftc.spellAttack = atk;
        }
    }

    /* -------------------------------------------- */

    diceCheck() {
        let eqn = sync.executeQuery();
        eqn.equations = [];
        let owner = this.scope.owner;
        let html = this.renderHTML();
        console.log(html);

        let eventData = {
            "f": owner.data.info.name.current,
            "icon": owner.data.info.img.current,
            "msg": this.flavors[Math.floor(Math.random() * this.flavors.length)],
            "data": eqn,
            "ui": "spell_action",
            "var": {"html": html}
        };
        runCommand("diceCheck", eventData);
    }

    /* -------------------------------------------- */
}

sync.render("FTC_SPELL_CAST", function (obj, app, scope) {
    return $(obj.data.data.var.html);
});


ftc_test_spell = function(character) {
    let spell = new FTCSpellAction(character.data.spellbook[0], undefined, {"owner": character.obj});
    spell.diceCheck();
};

// End FTCInit
});