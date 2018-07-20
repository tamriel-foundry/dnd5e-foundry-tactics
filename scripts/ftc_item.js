/* ------------------------------------------- */
/* Item Object Type                            */
/* ------------------------------------------- */

class FTCItem extends FTCEntity {

    get type() {
        // An item's primary type
        return this.data.info.type.current;
    }

    get variety() {
        // An item's secondary type
        return this.data.info.variety.current;
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
        return this.context.owner;
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

    get types() {
        return {
            ITEM_TYPE_DEFAULT: "item",
            ITEM_TYPE_INVENTORY: "item",
            ITEM_TYPE_SPELL: "spell",
            ITEM_TYPE_ABILITY: "ability"
        }
    }

    /* ------------------------------------------- */

    constructor(obj, context) {
        super(obj, context);
        FTC.item = this;
    }

    /* ------------------------------------------- */

    convertData(data) {

        // Maybe clean the item if it doesn't come from me
        if ( !data.info.type ) {
            data = ftc_update_entity(data, game.templates.item);
        }

        // Classify item type and variety
        data.info.type.current = this.classify_type(data);
        data.info.variety.current = data.info.variety.current || this.context.variety;
        return data;
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
            return (i.info.type.current === "note") ? "item" : i.info.type.current;
        }

        // Implied by container
        else if ( this.context.container ) {
            if ( this.context.container === "spellbook" ) return "spell";
            else if ( this.context.container === "abilities" ) return "ability";
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

    buildHTML(data, scope) {

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

    activateListeners(html, app, scope) {
        FTC.ui.activateTabs(html, this, app);
        FTC.forms.activateFields(html, this, app);
    }

    /* ------------------------------------------- */

    save() {

        // If the item was not changed, bail out
        if ( !this._changed ) return;

        // Saving an owned item
        if ( this.owner ) {
            if ( this.ownedItemUID === FTC._edit_item_uid ) this.editOwnedItem(this.context.itemId);
            return;
        }

        // Saving an unowned item
        console.log("Saving item " + this.name);
        this.obj.sync("updateAsset");
    }

    /* ------------------------------------------- */

    get ownedItemUID() {
        return this.owner.id + "." + this.context.container + "." + this.context.itemId;
    }

    editOwnedItem(itemId) {

        // Get the owner, container, and item position
        const item = this,
            owner = this.context.owner,
            container = this.context.container;

        // Update the itemId
        itemId = itemId || owner.data[container].length;
        this.context.itemId = itemId;

        // Flag the UID of the item being currently edited
        FTC._edit_item_uid = this.ownedItemUID;

        // Create an object and link it to an app
        const obj = sync.obj();
        obj.data = this.data;
        const app = sync.newApp("ui_renderItem", obj)
        obj.addApp(app);

        // Create an HTML frame containing the app
        const frame = $('<div class="edit-item flex flexcolumn">');
        app.appendTo(frame);

        // Attach a full-width confirmation button listen for submission
        const confirm = $('<button class="fit-x">Update Item</button>');
        confirm.click(function () {

            // Maybe close any open MCE editors
            console.log(app);
            if ( tinymce.activeEditor && app._mce && !app._mce.isHidden() ) {
                item.data.info.notes.current = app._mce.save();
                app._mce.destroy();
            }

            // Unset the active editing item
            FTC._edit_item_uid = undefined;
            layout.coverlay("edit-item");
            owner.updateItem(container, itemId, item.data);
        });
        frame.append(confirm);

        // Create the UI element
        ui_popOut({
            target: $("body"),
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
        const item = new FTCItem(obj);
        return item.renderHTML(app, scope);
    });

    // Register Item Character Drop Hook
    hook.add("OnDropCharacter", "FTCOnDrop", function(obj, app, scope, dt) {

        // Parse the data transfer
        if ( !dt ) return;
        let itemData = JSON.parse(dt.getData("OBJ")) || {};
        if (itemData._t !== "i") return;

        // Construct the character
        const char = new FTCCharacter(obj);
        const item = new FTCItem(itemData);

        // Add the item to the character
        char.addItem(item);
        return false;
    });
});

/* -------------------------------------------- */
