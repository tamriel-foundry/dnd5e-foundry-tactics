
/* -------------------------------------------- */
/*  Dice Roller                                 */
/* -------------------------------------------- */

class FTCDice {

    constructor(actor) {
        this.actor = actor;
        this.data = this.prepareData(actor);
    }

    /* -------------------------------------------- */

    rollDice(flavor, formula, data) {

        // Execute the query and log results
        console.log("Rolling: " + formula);
        const query = sync.executeQuery(formula, data);
        console.log(query);

        // Submit chat event
        const chatData = {
            "person": this.actor.name,
            "icon": this.actor.data.info.img.current,
            "flavor": flavor,
            "audio": "sounds/dice.mp3",
            "eventData": query
        };
        runCommand("chatEvent", chatData);
    };

    /* -------------------------------------------- */

    prepareData(actor) {
        /*
        This function exists to prepare all the standard rules data that would be used by dice rolling in D&D5e.
        */

        // Reference actor data
        let data = {
            "proficiency": actor.data.counters.proficiency.current,
            "spellcasting": actor.data.info.spellcasting.current || "Int",
            "offensive": actor.data.info.offensive.current || "Str"
        };

        // Attribute modifiers
        $.each(actor.data.stats, function(a, s) {
            data[a] = {
                "name": s.name,
                "prof": (s.proficient || 0) * data.proficiency,
                "value": s.current,
                "mod": s.modifiers.mod,
            }
        });

        // Skill modifiers
        $.each(actor.data.skills, function(n, s) {
            data[n] = {
                "name": s.name,
                "prof": (s.current || 0) * data.proficiency,
                "mod": data[s.stat].mod
            }
        });

        // Spell DC
        data["spellDC"] = 8 + data.proficiency + data[data.spellcasting].mod;

        // Weapon Mod and Spell Mod
        data["weaponMod"] = data[data.offensive].mod;
        data["spellMod"] = data[data.spellcasting].mod;

        // Armor Class
        data["baseAC"] = 10 + data["Dex"].mod;
        return data;
    };

    /* -------------------------------------------- */

    d20Check(adv, modifiers, situational) {
        /* The standard d20 with advantage or disadvantage plus modifiers */

        // Start with the basic d20
        let d20 = "$die=d20; 1d20";
        if ( adv === true ) d20 = "$die=d20; 2d20dl1";
        if ( adv === false ) d20 = "$die=d20; 2d20dh1";

        // Build the forumla of its parts
        return this.buildFormula(d20, modifiers, situational);
    }

    /* -------------------------------------------- */

    buildFormula(...parts) {
        /* Build an additive formula string from many parts */

        let formula = [];
        let _addPart = function(s) {
            s = (s) ? s + "" : "";
            s = (s.startsWith("+")) ? s.substring(1) : s;
            if ( s !== "" ) formula.push(s);
        };

        $.each(parts, function(_, d) {
            if (Array.isArray(d)) $.each(d, function(_, p) { _addPart(p) });
            else _addPart(d);
        });
        return formula.join(" + ");
    }

    /* -------------------------------------------- */

    rollAttributeTest(attr, situational, adv=undefined) {
        let fml = this.d20Check(adv, ["@mod"], situational),
            data = {"mod": this.data[attr].mod},
            flavor = this.data[attr].name + " Test";
        if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
        this.rollDice(flavor, fml, data);
    }

    /* -------------------------------------------- */

    rollAttributeSave(attr, situational, adv=undefined) {
        let fml = this.d20Check(adv, ["@mod", "@prof"], situational),
            data = {"mod": this.data[attr].mod, "prof": this.data[attr].prof},
            flavor = this.data[attr].name + " Save";
        if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
        this.rollDice(flavor, fml, data);
    }

    /* -------------------------------------------- */

    rollSkillCheck(skl, situational, adv=undefined) {
        let fml = this.d20Check(adv, ["@mod", "@prof"], situational),
            data = {"mod": this.data[skl].mod, "prof": this.data[skl].prof},
            flavor = this.data[skl].name + " Check";
        if ( adv !== undefined ) flavor += ( adv ) ? " (Advantage)": " (Disadvantage)";
        this.rollDice(flavor, fml, data);
    }

    /* -------------------------------------------- */

    rollWeaponAttack(bonus, situational, flavor="Weapon Attack", adv=undefined) {
        let fml = this.d20Check(adv, [bonus, "@mod", "@prof"] , situational),
            data = {"mod": this.data.weaponMod, "prof": this.data.proficiency};
        this.rollDice(flavor, fml, data);
    }

    /* -------------------------------------------- */

    rollWeaponDamage(damage, situational, flavor="Weapon Damage") {
        let fml = this.buildFormula(damage, "@mod", situational),
            data = {"mod": this.data.weaponMod};
        this.rollDice(flavor, fml, data);
    }

    /* -------------------------------------------- */

    rollSpellAttack(situational, flavor="Spell Attack", adv=undefined) {
        let fml = this.d20Check(adv, ["@mod", "@prof"], situational),
            data = {"mod": this.data.spellMod, "prof": this.data.proficiency};
        this.rollDice(flavor, fml, data);
    }

    /* -------------------------------------------- */

    rollSpellDamage(damage, situational, flavor="Spell Damage") {
        let fml = this.buildFormula(damage, situational);
        this.rollDice(flavor, fml, {"mod": this.data.spellMod});
    }
}
