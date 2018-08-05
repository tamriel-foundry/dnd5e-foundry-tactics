
/* ------------------------------------------- */
/*  Element Data Model                         */
/* ------------------------------------------- */

FTC.elements = {
    "core": {
        "_t": "i",
        "info": {
            "name": { "name": "Name" },
            "img": { "name": "Artwork" },
            "notes": { "name": "Description" },
        },
        "source": { "name": "Source" },
        "tags": {},
    },
    "inventory": {
        "quantity": { "name": "Quantity" },
        "price": { "name": "Price" },
        "weight": { "name": "Weight" }
    },
    "Weapon": {
        "type": { "name": "Weapon Type" },
        "hit": { "name": "Attack Bonus" },
        "damage": { "name": "Damage" },
        "damage2": { "name": "Alternate Damage" },
        "range": { "name": "Range" },
        "properties": { "name": "Properties" },
        "proficient": { "name": "Proficient" },
        "modifier": { "name": "Offensive Ability" }
    },
    "Spell": {
        "level": { "name": "Spell Level" },
        "type": { "name": "Spell Type" },
        "school": { "name": "Spell School" },
        "duration": { "name": "Spell Duration" },
        "time": { "name": "Casting Time" },
        "range": { "name": "Spell Range" },
        "damage": { "name": "Spell Damage" },
        "components": { "name": "Spell Components" },
        "materials": { "name": "Material Components" },
        "concentration": { "name": "Requires Concentration" },
        "modifier": { "name": "Spellcasting Ability" }
    },
    "Tool": {
        "proficient": { "name": "Proficient" }
    },
    "Armor": {
        "type": { "name": "Armor Type" },
        "ac": { "name": "Armor Class" },
        "strength": { "name": "Required Strength" },
        "stealth": { "name": "Stealth Disadvantage" },
        "proficient": { "name": "Proficient" },
        "equipped": { "name": "Equipped" }
    },
    "Consumable": {
        "type": { "name": "Consumable Type" },
        "charges": { "name": "Uses Remaining" }
    },
    "Feat": {
        "type": { "name": "Feat Type" },
        "requirements": { "name": "Requirements" },
        "time": { "name": "Feat Usage" },
        "cost": { "name": "Ability Cost" }
    }
};


/* ------------------------------------------- */
/*  Base Element Entity Type                   */
/* ------------------------------------------- */


class FTCElement extends FTCEntity {

    static getElement(type) {
        /* Get the specialized Element class definition for a certain type */
        const classes = {
            "Weapon": FTCWeapon,
            "Armor": FTCElement,
            "Spell": FTCSpell,
            "Feat": FTCFeat,
            "Tool": FTCElement,
            "Consumable": FTCElement,
            "Item": FTCElement
        };
        return classes[type] || FTCElement;
    }

    static fromData(obj, context) {
        /* A factory method which returns a specialized class for elements of a certain type */
        const cls = this.getElement(obj._type || obj.data._type);
        return new cls(obj, context);
    }

    /* ------------------------------------------- */

    /* Ownership */
    get owner() {
        return this.context.owner;
    }

    /* Container */
    get container() {
        return "inventory";
    }

    /* ------------------------------------------- */

    /* Templates */
    get mainTemplate() {
        const td = FTC.TEMPLATE_DIR + "elements/";
        let template =  this.type === "Item" ? "simple.html" : "body.html";
        return td + template;
    }

    get templateParts() {
        const td = FTC.TEMPLATE_DIR + "elements/";
        let templates = {
            "ELEMENT_SIDEBAR": td + "sidebar.html",
            "ELEMENT_NOTES": td + "notes.html",
            "ELEMENT_INVENTORY": ( this.type === "Feat" ) ? undefined : td + "inventory.html"
        };
        templates["ELEMENT_DETAILS"] = td + this.type.toLowerCase() + '.html';
        return templates;
    }

    /* ------------------------------------------- */

    static applyDataModel() {

        // Override Item Asset Type Dimensions
        assetTypes['i'].width = "650px";
        assetTypes['i'].height = "500px";

        // Update Element Templates
        $.each(game.templates.elements, function(type, definition) {

            // Add core attributes to all elements
            mergeObject(definition, FTC.elements.core, true, true, true);
            definition["_type"] = type;

            // Add inventory attributes to items, weapons, armor, tools, and consumables
            const isInventory = ["Item", "Weapon", "Armor", "Tool", "Consumable", "Spell"];
            if ( isInventory.includes(type) ) mergeObject(definition, FTC.elements.inventory, true, false, true);

            // Add type-specific data
            mergeObject(definition, FTC.elements[type], true, false, true);
        });
        console.log("Foundry Tactics | Element Templates Updated");
    }

    /* ------------------------------------------- */

    convertData(data) {
        return data
    }

    /* ------------------------------------------- */

    enrichData(data) {

        // Collapse tags
        data.tagStr = Object.keys(data.tags || {}).join(", ");

        // Quantity, Price, and Weight
        $.each(["quantity", "price", "weight"], function(_, v) {
            if ( v in data ) data[v].current = parseFloat(data[v].current || 0.0);
        });
        return data;
    }

    /* ------------------------------------------- */

    buildHTML(data, scope) {
        let html = FTC.loadTemplate(this.mainTemplate);
        $.each(this.templateParts, function(name, path) {
            html = FTC.injectTemplate(html, name, path);
        });
        return html;
    }

    /* ------------------------------------------- */

    activateListeners(html, app, scope) {
        FTC.ui.activateTabs(html, this, app);
        FTC.forms.activateFields(html, this, app);
    }

    /* ------------------------------------------- */

    static editOwnedItem(owner, container, data, itemId) {
        /* Render an editable sheet for an owned item */

        // Get a new itemId and store a local reference
        itemId = itemId || owner.data[container].length;

        // Create a sync object for the item data
        const obj = sync.obj();
        obj.data = data;

        // Trigger a render for the app
        const scope = {"owner": owner, "container": container, "itemID": itemId};
        const app = sync.newApp("FTC_RENDER_ELEMENT", obj, scope);

        // Pop out the UI element
        let name = data.info.name.current || "New " + data._type;
        ui_popOut({
            target: $("body"),
            title: owner.name + ": " + name + " [Edit]",
            id: "edit-item",
            maximize: false,
            minimize: false,
            style: {"width": assetTypes["i"].width, "height": assetTypes["i"].height}
        }, app);
    }

    /* ------------------------------------------- */
    /*  Chat Actions                               */
    /* ------------------------------------------- */

    chatAction() {
        /* Wrapper method for element chat actions. Each element type must define the getChatData method. */

        // Disallow chat actions for unowned items
        if ( !this.owner ) {
            throw "Chat actions are not supported for unowned elements.";
        }

        // Submit chat event
        const chatData = {
            "person": this.owner.name,
            "eid": this.owner.id,
            "icon": this.owner.data.info.img.current,
            "ui": "FTC_ITEM_ACTION",
            "audio": "sounds/spell_cast.mp3",
            "chatData": this.getChatData()
        };
        runCommand("chatEvent", chatData);
    };

    /* ------------------------------------------- */

    getChatData() {
        return cleanObject(this.data, game.templates.elements[this.type], false, false);
    };

    /* ------------------------------------------- */

    static renderChatHTML(chatData) {

        // Load and populate the chat template
        let html = FTC.loadTemplate("html/actions/item.html");
        html = $(FTC.populateTemplate(html, chatData));
        return html;
    }

    /* ------------------------------------------- */
    /*  Saving and Cleanup                         */
    /* ------------------------------------------- */

    cleanup() {
        /* Save the item's owner if an edit panel is closed */
        if ( this.owner ) {
            if ( this._changed ) this.owner.updateItem(this.context.container, this.context.itemId, this.data);
        }
        else super.cleanup();
    }

    /* ------------------------------------------- */

    save() {
        /* Don't save owned items, instead handle that in cleanup */
        if ( this.owner ) return;
        super.save();
    }
}


/* ------------------------------------------- */
/*  Weapons                                    */
/* ------------------------------------------- */


class FTCWeapon extends FTCElement {

    get container() {
        return "inventory";
    }

    /* ------------------------------------------- */

    getWeaponTypeStr() {
        let types = {
            "simplem": "Simple Melee",
            "simpler": "Simple Ranged",
            "martialm": "Martial Melee",
            "martialr": "Martial Ranged",
            "natural": "Natural",
            "improv": "Improvised",
            "ammo": "Ammunition"
        };
        return types[this.data.type.current];
    }

    /* ------------------------------------------- */

    getChatData() {
        const owner = this.owner.getCoreData();
        const data = cleanObject(this.data, game.templates.elements[this.type], false, false);

        // Flag rollable permission
        const isOwner = this.owner.isOwner;
        data.entID = this.owner.id;
        data.rollable = {
            "hit": isOwner ? "rollable" : "hidden",
            "damage": ( isOwner && data.damage.current ) ? "rollable" : "hidden",
            "damage2": ( isOwner && data.damage2.current ) ? "rollable": "hidden"
        };

        // Add character data
        data.modifier.current = data.modifier.current || owner.attributes.offensive.current;
        data.modifier.mod = owner.abilities[data.modifier.current].mod;
        data.proficiency = owner.proficiency;

        // Update item data
        data.hit.current = parseInt(data.hit.current || 0);
        const props = [
            this.getWeaponTypeStr(),
            owner.abilities[data.modifier.current].name,
            data.proficient ? "Proficient" : "Not Proficient",
            data.range.current,
            data.properties.current
        ];
        data.props = FTC.ui.chatProperties(props);
        return data;
    }

    /* ------------------------------------------- */

    static renderChatHTML(chatData) {

        // Load and populate the chat template
        let html = FTC.loadTemplate("html/actions/weapon.html");
        html = $(FTC.populateTemplate(html, chatData));

        // Weapon Attack
        html.find("h3.action-roll.weapon-hit").click(function() {
            FTCItemActions.weaponAttack($(this));
        });

        // Weapon Damage
        html.find("h3.action-roll.weapon-damage").click(function() {
            FTCItemActions.weaponDamage($(this));
        });
        return html;
    }
}



/* ------------------------------------------- */
/*  Spells                                     */
/* ------------------------------------------- */

class FTCSpell extends FTCElement {

    get container() {
        return "spellbook";
    }

    /* ------------------------------------------- */

    toScroll() {
        let i = duplicate(this.data);
        i._type = "Consumable";
        i.info.name.current = "Scroll of " + i.info.name.current;
        i = ftc_update_entity(i, game.templates.elements.Consumable);
        i.type.current = "scroll";
        i.charges.current = i.charges.max = 1;
        return FTCElement.fromData(i);
    }

    /* ------------------------------------------- */

    getChatData() {
        const owner = this.owner.getCoreData();
        const data = cleanObject(this.data, game.templates.elements[this.type], false, false);

        // Flag rollable permission
        const isOwner = this.owner.isOwner;
        data.entID = this.owner.id;
        data.rollable = {
            "dc": ( data.type.current === "save" ) ? "" : "hidden",
            "hit": ( isOwner && (data.type.current === "attack") ) ? "rollable" : "hidden",
            "damage": ( isOwner && data.damage.current ) ? "rollable" : "hidden"
        };

        // Add character data
        data.modifier.current = data.modifier.current || owner.attributes.spellcasting.current;
        data.modifier.mod = owner.abilities[data.modifier.current].mod;
        data.proficiency = owner.proficiency;
        data.spellDC = owner.attributes.spellcasting.dcstr;
        data.canCrit = data.type.current === "attack";

        // Update item data
        const props = [
            (data.level.current === 0) ? "Cantrip" : data.level.current.ordinalString() + " Level",
            data.school.current.capitalize(),
            data.time.current.titleCase(),
            data.range.current,
            data.duration.current,
            data.components.current,
            data.materials.current,
            data.concentration.current ? "Concentration" : undefined,
            data.source.current
        ];
        data.props = FTC.ui.chatProperties(props);
        return data;
    }

    /* ------------------------------------------- */

    static renderChatHTML(chatData) {

        // Load and populate the chat template
        let html = FTC.loadTemplate("html/actions/spell.html");
        html = $(FTC.populateTemplate(html, chatData));

        // Weapon Attack
        html.find("h3.action-roll.spell-hit").click(function() {
            FTCItemActions.spellAttack($(this));
        });

        // Weapon Damage
        html.find("h3.action-roll.spell-damage").click(function() {
            FTCItemActions.spellDamage($(this));
        });
        return html;
    }
}


/* ------------------------------------------- */
/*  Feats                                      */
/* ------------------------------------------- */

class FTCFeat extends FTCElement {

    get container() {
        return "feats";
    }

    /* ------------------------------------------- */

    getChatData() {
        const data = cleanObject(this.data, game.templates.elements[this.type], false, false);
        const props = [
            data.type.current.titleCase(),
            data.requirements.current,
            data.source.current,
            data.time.current.titleCase(),
            data.cost.current
        ];
        data.props = FTC.ui.chatProperties(props);
        return data;
    }
}


/* ------------------------------------------- */
/*  Elements Initialization Hook               */
/* ------------------------------------------- */


hook.add("FTCInit", "Elements", function() {

    // Apply the Item Data Model
    FTCElement.applyDataModel();

    // Render Item Sheets
    sync.render("FTC_RENDER_ELEMENT", function(obj, app, scope) {
        const element = FTCElement.fromData(obj, scope);
        return element.render(app, scope);
    });

    // Register Item Character Drop Hook
    hook.add("OnDropCharacter", "FTCOnDrop", function(obj, app, scope, dt) {

        // Parse the data transfer
        if ( !dt ) return;
        let itemData = JSON.parse(dt.getData("OBJ")) || {};
        if (itemData._t !== "i") return;

        // Construct an owned item object
        const owner = new FTCActor(obj);
        let item = FTCElement.fromData(itemData, {"owner": owner});

        // If we are dropping a spell on the inventory tab, it becomes a "Scroll of ___"
        if ( item instanceof FTCSpell && owner.data.tabs["content-tabs"] === "tab-inventory" ) {
            item = item.toScroll();
        }

        // Add the item to the owner
        owner.dropItem(item);
        return false;
    });
});


/* ------------------------------------------- */
