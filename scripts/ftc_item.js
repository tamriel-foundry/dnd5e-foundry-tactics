/* ------------------------------------------- */
/* Item Object Type                            */
/* ------------------------------------------- */

class FTCItem extends FTCObject {

    get type() {
        return this.data.info.type.current;
    }

    get spell() {
        return this.data.spell;
    }

    get weapon() {
        return this.data.weapon;
    }

    get armor() {
        return this.data.armor;
    }

    get ability() {
        return this.data.ability;
    }

    get owner() {
        return this.scope.owner;
    }

    get template() {
        return FTC.TEMPLATE_DIR + "items/item-body.html";
    }

    get parts() {
        return {
            ITEM_SIDEBAR: FTC.TEMPLATE_DIR + 'items/item-sidebar.html',
            ITEM_TAB_NOTES: FTC.TEMPLATE_DIR + 'items/tab-notes.html',
            ITEM_TAB_ARMOR: FTC.TEMPLATE_DIR + 'items/tab-armor.html',
            ITEM_TAB_WEAPON: FTC.TEMPLATE_DIR + 'items/tab-weapon.html',
            ITEM_TAB_SPELL: FTC.TEMPLATE_DIR + 'items/tab-spell.html',
            ITEM_TAB_ABILITY: FTC.TEMPLATE_DIR + 'items/tab-ability.html',
            ITEM_TAB_ITEM: FTC.TEMPLATE_DIR + 'items/tab-item.html'
        };
    }

    /* ------------------------------------------- */

    constructor(obj, app, scope) {
        super(obj, app, scope);

        // Classify the item type
        this.data.info.type.current = this.classify_type(this.data);

        // Record local reference for debugging
        FTC.item = this;
    }

    /* ------------------------------------------- */

    enrichData(data) {

        // Temporary FTC display data
        data.ftc = data.ftc || {};

        // Classify data type
        data.ftc.typeStr = this.type.capitalize();

        // Default Image
        data.info.img.current = data.info.img.current || "/content/icons/Pouch1000p.png";

        // Collapse tags
        data.ftc.tagStr = Object.keys(data.tags || {}).join(", ");

        // Ensure quantity, price, and weight
        data.info.price = data.info.price || {"name": "Price", "current": 0.0};
        $.each(["weight", "quantity", "price"], function(_, v) {
           data.info[v].current = parseFloat(data.info[v].current || 0.0)
        });
        return data;
    }

    /* ------------------------------------------- */

    classify_type(i) {

        // Already defined
        if (i.info.type && i.info.type.current) {
            i.info.type.current = (this.type === "note") ? "item" : this.type;
            return this.type;
        }

        // Provided by scope
        if ( this.scope.type ) return this.scope.type;

        // Implied by container
        else if ( this.scope.container ) {
            if ( this.scope.container === "spellbook" ) return "spell";
            else if ( this.scope.container === "abilities" ) return "ability";
        }

        // Implied by tags
        if (("spell" in i.tags) || (i.spell && i.spell.level.current)) return "spell";
        else if (("weapon" in i.tags) || (i.weapon && i.weapon.damage.current)) return "weapon";
        else if (("armor" in i.tags) || (i.armor && i.armor.ac.current)) return "armor";
        else if ("ability" in i.tags || "talent" in i.tags || (i.ability && i.ability.source.current)) return "ability";

        // Default type is "item"
        return "item";
    }

    /* ------------------------------------------- */

    buildHTML(data) {

        // Build template body
        let details = "ITEM_TAB_"+this.type.toUpperCase(),
            html = FTC.loadTemplate(this.template);
        html = html.replace("ITEM_DETAILS_TEMPLATE", details);

        // Inject template parts
        $.each(this.parts, function(name, path) {
            html = FTC.injectTemplate(html, name, path);
        });
        return html;
    }

    /* ------------------------------------------- */

    activateEventListeners(html) {
        FTC.ui.activate_tabs(html, this.obj, this.app);
        FTC.forms.activateFields(html, this, this.app);
    }

    /* ------------------------------------------- */

    save() {

        // If the item was not changed, bail out
        if ( !this.changed ) return;

        // Saving an owned item
        if ( this.scope.owner ) {
            if ( this.obj._uid === FTC._edit_item_uid ) this.editOwnedItem(this.scope.itemId);
            return;
        }

        // Saving an unowned item
        console.log("Saving item " + this.name);
        this.obj.sync("updateAsset");
    }

    /* ------------------------------------------- */

    editOwnedItem(itemId) {

        // Get the owner, container, and item position
        const item = this,
            owner = this.scope.owner,
            container = this.scope.container;

        // Flag the UID of the item being currently edited
        FTC._edit_item_uid = this.obj._uid;

        // Update the itemId
        itemId = itemId || owner.data[container].length;
        this.scope.itemId = itemId;

        // Create a new application window for editing an item and associate it with the working data
        const newApp = sync.newApp("ui_renderItem", this.obj, this.scope);
        this.obj._apps.push(newApp);

        // Create an HTML frame containing the app
        const frame = $('<div class="edit-item flex flexcolumn">');
        newApp.appendTo(frame);

        // Attach a full-width confirmation button listen for submission
        const confirm = $('<button class="fit-x">Update Item</button>');
        confirm.click(function () {

            // Maybe close any open MCE editors
            if ( newApp._mce ) {
                item.data.info.notes.current = newApp._mce.save();
                newApp._mce.destroy();
            }

            // Unset the active editing item
            FTC._edit_item_uid = undefined;
            layout.coverlay("edit-item");
            owner.updateItem(container, itemId, item.data);
        });
        frame.append(confirm);

        // Create the UI element
        ui_popOut({
            target: this.owner.app,
            id: "edit-item",
            maximize: false,
            minimize: false,
            style: {"width": assetTypes["i"].width, "height": assetTypes["i"].height}
        }, frame).resizable();
    }

    /* -------------------------------------------- */
    /*  Item Helpers                                */
    /* -------------------------------------------- */

    getWeaponVarietyStr(v) {
        let vars = {
            "simplem": "Simple Martial",
            "simpler": "Simple Ranged",
            "martialm": "Martial Melee",
            "martialr": "Martial Ranged",
            "natural": "Natural",
            "improv": "Improvised",
            "ammo": "Ammunition"
        }
        return vars[v];
    }
}

/* -------------------------------------------- */
/* FTC Initialization Hook                      */
/* -------------------------------------------- */

hook.add("FTCInit", "Items", function() {

    // Configure Item Asset Type Dimensions
    assetTypes['i'].width = "650px";
    assetTypes['i'].height = "500px";

    // Render Item Sheets
    sync.render("ui_renderItem", function(obj, app, scope) {
        const item = new FTCItem(obj, app, scope);
        return item.renderHTML();
    });

    // Register Item Character Drop Hook
    hook.add("OnDropCharacter", "FTCOnDrop", function(obj, app, scope, dt) {
        if ( !dt ) return;

        // Parse the data transfer
        let item = JSON.parse(dt.getData("OBJ")) || {};
        if (item._t !== "i") return;

        // Maybe clean the item if it doesn't come from me
        if ( !item.info.type ) {
            item = ftc_update_entity(item, game.templates.item);
            item = new FTCItem(item).data;
        }
        const type = item.info.type.current;

        // Inventory Items
        if (["weapon", "armor", "item"].includes(type)) {
            obj.data.inventory.push(item);
        }

        // Spellbook Spells
        else if ( "spell" === type ) {
            obj.data.spellbook.push(item);
        }

        // Abilities
        else if ( "ability" === type ) {
            obj.data.abilities.push(item);
        }

        // Save and return false to prevent additional actions
        obj.sync("updateAsset");
        return false;
    });
});

/* -------------------------------------------- */
