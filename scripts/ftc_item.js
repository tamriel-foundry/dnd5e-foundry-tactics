
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

    static fromData(obj, context) {
        /* A factory method which returns a specialized class for elements of a certain type */

        const type = obj._type || obj.data._type;
        const classes = {
            "Weapon": FTCWeapon,
            "Armor": FTCElement,
            "Spell": FTCSpell,
            "Feat": FTCFeat,
            "Tool": FTCElement,
            "Consumable": FTCElement,
            "Item": FTCElement
        };
        const cls = type ? classes[type] : FTCElement;
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

    getWeaponTypeStr(v) {
        let types = {
            "simplem": "Simple Martial",
            "simpler": "Simple Ranged",
            "martialm": "Martial Melee",
            "martialr": "Martial Ranged",
            "natural": "Natural",
            "improv": "Improvised",
            "ammo": "Ammunition"
        };
        return types[v];
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
}


/* ------------------------------------------- */
/*  Feats                                      */
/* ------------------------------------------- */

class FTCFeat extends FTCElement {

    get container() {
        return "feats";
    }
}


/* ------------------------------------------- */
/*  Elements Initialization Hook               */
/* ------------------------------------------- */


hook.add("FTCInit", "Elements", function() {

    // Apply the Item Data Model
    FTCElement.applyDataModel();

    // Override Item Asset Type Dimensions
    assetTypes['i'].width = "650px";
    assetTypes['i'].height = "500px";

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
        owner.addItem(item);
        return false;
    });
});


/* ------------------------------------------- */
/*  V2 Converter                               */
/* ------------------------------------------- */

function ftc_migrateElement(i) {

    // Assign type
    i._type = i.info.type.current.capitalize();
    i._type = (i._type === "Ability") ? "Feat": i._type;

    // Move attributes to root
    let sections = ["info", "armor", "weapon", "spell"];
    $.each(sections, function(_, section) {
        mergeObject(i, i[section], true, false, true);
    });

    // Rename attributes
    i.type = i.variety;
    i.strength = i.str;
    i.stealth = i.ste;
    if (i._type === "Feat") i.cost = i.materials;

    // Start by merging against the new data template
    let template = game.templates.elements[i._type],
        data = mergeObject(template, i, true, false, false);

    // Clean any residual data
    cleanObject(data, template, true, true);
    $.each(data, function(name, _) {
        if ( name.startsWith("_") && !["_t", "_type"].includes(name)) delete data[name];
    });
    return data
}
