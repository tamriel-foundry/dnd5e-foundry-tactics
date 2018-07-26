
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
        "ritual": { "name": "Ritual Spell" },
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

    /* Ownership */
    get owner() {
        return this.context.owner;
    }

    /* Templates */
    get templates() {
        const td = FTC.TEMPLATE_DIR + "elements/";
        return {
            "BODY": td + "body.html",
            "ELEMENT_SIDEBAR": td + "sidebar.html",
            "ELEMENT_NOTES": td + "notes.html",
            "ELEMENT_ARMOR": td + "armor.html",
            "ELEMENT_CONSUMABLE": td + "item.html",
            "ELEMENT_SPELL": td + "spell.html",
            "ELEMENT_TOOL": td + "item.html",
            "ELEMENT_WEAPON": td + "weapon.html"
        }
    }

    /* ------------------------------------------- */

    static applyDataModel() {

        // Update Element Templates
        $.each(game.templates.elements, function(type, definition) {

            // Add core attributes to all elements
            ftc_merge(definition, FTC.elements.core, true, true, true);
            definition["_type"] = type;

            // Add inventory attributes to items, weapons, armor, tools, and consumables
            const isInventory = ["Item", "Weapon", "Armor", "Tool", "Consumable", "Spell"];
            if ( isInventory.includes(type) ) ftc_merge(definition, FTC.elements.inventory, true, false, true);

            // Add type-specific data
            ftc_merge(definition, FTC.elements[type], true, false, true);
        });
        console.log("Foundry Tactics - Element Templates Updated");
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
        const templates = this.templates;
        let html = FTC.loadTemplate(templates['BODY']);

        // Inject template parts
        templates["ELEMENT_DETAILS"] = templates["ELEMENT_" + this.type.toUpperCase()];
        $.each(templates, function(name, path) {
            html = FTC.injectTemplate(html, name, path);
        });
        return html;
    }

    /* ------------------------------------------- */

    activateListeners(html, app, scope) {
        FTC.ui.activateTabs(html, this, app);
        FTC.forms.activateFields(html, this, app);
    }
}


/* ------------------------------------------- */
/*  Weapons                                    */
/* ------------------------------------------- */

class FTCWeapon extends FTCElement {

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
/*  Base Element Entity Type                   */
/* ------------------------------------------- */





/* ------------------------------------------- */
/*  Elements Initialization Hook               */
/* ------------------------------------------- */


hook.add("FTCInit", "Elements", function() {

    // Apply the Item Data Model
    FTCElement.applyDataModel()

    // Override Item Asset Type Dimensions
    assetTypes['i'].width = "650px";
    assetTypes['i'].height = "500px";

    // Render Item Sheets
    sync.render("FTC_RENDER_ELEMENT", function(obj, app, scope) {
        const element = new FTCElement(obj);
        return element.render(app, scope);
    });

    // Register Item Character Drop Hook
    hook.add("OnDropCharacter", "FTCOnDrop", function(obj, app, scope, dt) {

        // Parse the data transfer
        if ( !dt ) return;
        let itemData = JSON.parse(dt.getData("OBJ")) || {};
        if (itemData._t !== "i") return;

        // Construct the character
        const owner = new FTCCharacter(obj);
        const item = new FTCElement(itemData);

        // Add the item to the character
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
