
/* -------------------------------------------- */
/*  FTC ITEM ACTION                             */
/* -------------------------------------------- */

class FTCItemAction {

    static get ui() {
        return "FTC_ITEM_ACTION";
    }

    get template() {
        let type = this.item.type;
        return FTC.TEMPLATE_DIR + `actions/action-${type}.html`;
    }

    /* -------------------------------------------- */

    static toChat(actor, itemData) {
        /*
        Submit a dice check to chat using this static method. The eventData from this submission is cached and picked
        up later by the sibling fromChat method.

        Arguments:
            actor (FTCCharacter): The actor who is performing the item action
            itemData (Object): Data for the item being acted upon
            ui (str): The UI name to render
        */

        // Generate event data
        let eventData = {
            "f": actor.data.info.name.current,
            "href": actor.data.info.img.current,    // This is inconsistent, similar to "icon" for other events
            "ui": FTCItemAction.ui,
            "actorData": actor.data,
            "itemData": itemData
        };

        // Submit the chat event
        runCommand("chatEvent", eventData);
    }

    /* -------------------------------------------- */

    static fromChat(obj) {
        /*
        Retrieve the cached eventData from the chat log and handle it to render the HTML display.

        Arguments:
            obj: A chat object. The eventData from the event is found in obj.data

        Returns:
            Rendered chat event HTML as a jQuery object
        */

        // Instantiate actor and item
        let actor = new FTCCharacter(obj.actorData),
            item = new FTCItem(obj.itemData),
            action = new FTCItemAction(actor, item);

        // Build the action html and return to the sync.render function
        return action;
    }

    /* -------------------------------------------- */

    constructor(actor, item) {
        this.actor = actor;
        this.item = item;
    }

    /* -------------------------------------------- */

    get name() { return this.item.name; }
    get dice() { return this.actor.dice; }
    get canRoll() { return hasSecurity(getCookie("UserID"), "Owner", this.actor.data); }

    /* -------------------------------------------- */

    actionProperties(props) {
        let propStr = "";
        $.each(props, function(_, p) {
            if (p) propStr += `<span class="action-prop">${p}</span>`;
        });
        return propStr;
    }

    /* -------------------------------------------- */

    renderHTML() {

        // Load the template
        let html = FTC.loadTemplate(this.template),
            data = this.item.data;

        // Enrich the data
        data = this[this.item.type + "Data"](data);

        // Populate the template
        html = $(FTC.populateTemplate(html, data));

        // Activate Event Listeners
        this.activateEventListeners(html);
        return html;
    }

    /* -------------------------------------------- */

    weaponData(data) {

        // Construct weapon properties
        const props = [
            this.item.getWeaponVarietyStr(),
            data.weapon.range.current,
            data.weapon.properties.current,
            data.weapon.proficient ? "Proficient" : "Not Proficient"
        ];
        data.actionProps = this.actionProperties(props);

        // Populate weapon attack rolls
        if ( this.canRoll ) {

            // Weapon Attack Roll
            let at = "Weapon Attack",
                bon = data.weapon.hit.current || "";
            data.attack = `<h3 class="action-roll weapon-hit" title="${at}" data-bonus="${bon}">${at}</h3>`;

            // Weapon Damage Roll
            let dt = "Weapon Damage",
                d1 = data.weapon.damage.current,
                d2 = data.weapon.damage2.current || "";
            data.damage = `<h3 class="action-roll weapon-damage" title="${dt}" data-d1="${d1}" data-d2="${d2}">${dt}</h3>`;
        }
        return data;
    }

    /* -------------------------------------------- */

    spellData(data) {

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
            (spell.concentration.current) ? "Concentration" : undefined,
            data.info.source.current
        ];
        data.actionProps = this.actionProperties(props);

        // Spell DC
        if (data.info.variety.current === "save") {
            let dc = this.dice.data.spellDC;
            data.spellDC = `<h3 class="spell-dc" title="Spell DC">Spell DC ${dc}</h3>`
        }

        // Populate spell attack rolls
        if ( this.canRoll ) {

            // Spell Attack Roll
            if (data.info.variety.current === "attack") {
                let at = "Spell Attack";
                data.attack = `<h3 class="action-roll spell-hit" title="${at}" data-attr="">${at}</h3>`;
            }

            // Spell Damage Roll
            if (data.weapon.damage.current) {
                let dt = (data.weapon.damage.type === "healing") ? "Spell Healing" : "Spell Damage",
                    dam = data.weapon.damage.current;
                data.damage = `<h3 class="action-roll spell-damage" title="${dt}" data-damage="${dam}">${dt}</h3>`;
            }
        }
        return data;
    }

    /* -------------------------------------------- */

    abilityData(data) {

        // List ability properties
        const props = [
            data.info.variety.current.capitalize() + ": " + data.info.requirements.current.capitalize(),
            data.spell.time.current.titleCase(),
            data.spell.materials.current,
            data.info.source.current
        ];
        data.actionProps = this.actionProperties(props);
        return data;
    }

    /* -------------------------------------------- */

    activateEventListeners(html) {
        const dice = this.dice,
            name = this.item.name;

        // Spell Attack
        html.find("h3.action-roll.spell-hit").click(function() {
            dice.rollSpellAttack(undefined, name+" "+$(this).attr("title"));
        });

        // Spell Damage
        html.find("h3.action-roll.spell-damage").click(function() {
            let dam = $(this).attr("data-damage");
            dice.rollSpellDamage(dam, undefined, name+" "+$(this).attr("title"));
        });

        // Weapon Attack
        html.find("h3.action-roll.weapon-hit").click(function() {
            let bonus = $(this).attr("data-bonus");
            dice.rollWeaponAttack(bonus, undefined, name+" "+$(this).attr("title"));
        });

        // Weapon Damage
        html.find("h3.action-roll.weapon-damage").click(function() {
            let d1 = $(this).attr("data-d1"),
                d2 = $(this).attr("data-d2");
            dice.rollWeaponDamage(d1, d2, undefined, name+" "+$(this).attr("title"));
        });
        return html;
    }
}

/* -------------------------------------------- */

hook.add("FTCInit", "ItemActions", function() {
    sync.render(FTCItemAction.ui, function(obj, app, scope) {
        const action = FTCItemAction.fromChat(obj);
        return action.renderHTML();
    });
});

/* -------------------------------------------- */
