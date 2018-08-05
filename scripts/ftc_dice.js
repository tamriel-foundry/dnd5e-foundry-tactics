
/* -------------------------------------------- */
/*  Dice Roller                                 */
/* -------------------------------------------- */

class FTCDice {

    roll(actor, flavor, formula, data) {

        // Execute the query and log results
        console.log("Rolling: " + formula);
        const query = sync.executeQuery(formula, data);
        console.log(query);

        // Submit chat event
        const chatData = {
            "person": actor.name,
            "eID": actor.id,
            "icon": actor.img,
            "flavor": flavor,
            "audio": "sounds/dice.mp3",
            "eventData": query
        };
        runCommand("chatEvent", chatData);
    };

    /* -------------------------------------------- */

    d20(adv) {
        /* The standard d20 with advantage or disadvantage plus modifiers */

        let d20 = "$die=d20; 1d20";
        if ( adv === true ) d20 = "$die=d20; 2d20dl1";
        if ( adv === false ) d20 = "$die=d20; 2d20dh1";
        return d20
    }

    /* -------------------------------------------- */

    crit(damage) {
        return damage.replace(/([0-9]+)d([0-9]+)/g, function(match, nd, d) {
            nd = parseInt(nd) * 2;
            return nd + "d" + d;
        });
    }

    /* -------------------------------------------- */

    formula(...parts) {
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

    static simulate(formula, number) {
        number = number || 1000;
        let results = [];
        for (let i = 0; i < number; i++) {
            results.push(sync.eval(formula));
        }

        // Summarize Results
        console.log(`Simulated result for ${formula} | ${number} iterations`);
        let sum = results.reduce(function(a, b) { return a + b; });
        let mean = sum / results.length;
        let min = Math.min(...results);
        let max = Math.max(...results);
        console.log("Mean: " + mean);
        console.log("Min: " + min);
        console.log("Max: " + max);
    };
}


hook.add("FTCInit", "Dice", function() {
    FTC.Dice = new FTCDice();
});

