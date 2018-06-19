/* ------------------------------------------- */
/* Item Object Type                            */
/* ------------------------------------------- */

class FTCItem extends FTCObject {

    constructor(obj, app, scope) {
        super(obj, app, scope);

        // Primary Template and Parts
        this.template = FTC.TEMPLATE_DIR + 'items/item-{type}.html';
        this.parts = {
            ITEM_HEADER: FTC.TEMPLATE_DIR + 'items/item-header.html',
            ITEM_SIDEBAR: FTC.TEMPLATE_DIR + 'items/item-sidebar.html',
            ITEM_TAB_NOTES: FTC.TEMPLATE_DIR + 'items/tab-notes.html',
            ITEM_TAB_ARMOR: FTC.TEMPLATE_DIR + 'items/tab-armor.html',
            ITEM_TAB_WEAPON: FTC.TEMPLATE_DIR + 'items/tab-weapon.html',
            ITEM_TAB_SPELL: FTC.TEMPLATE_DIR + 'items/tab-spell.html',
            ITEM_TAB_ABILITY: FTC.TEMPLATE_DIR + 'items/tab-ability.html',
        };
    }

    /* ------------------------------------------- */

    static enrichData(item) {

        // Temporary FTC data
        item.ftc = item.ftc || {};

        // Default Image
        item.info.img.current = item.info.img.current || "/content/icons/Pouch1000p.png";

        // Collapse tags
        item.info.tagstr = Object.keys(item.tags || {}).join(", ");

        // Classify item type
        item.info.type = this.classify_type(item);

        // Ensure quantity, price, and weight
        item.info.price = item.info.price || {"name": "Price", "current": 0.0};
        $.each(["weight", "quantity", "price"], function(_, v) {
           item.info[v].current = parseFloat(item.info[v].current || 0.0)
        });

        // Return either the full object or just the item data
        return item;
    }

    /* ------------------------------------------- */

    static classify_type(item) {
        if (item.info.type) return item.info.type;
        var type = {"name": "Entry Type", "current": "note"};
        if (item.spell.level.current) type.current = "spell";
        else if (item.weapon.damage.current) type.current = "weapon";
        else if (item.armor.ac && item.armor.ac.current) type.current = "armor";
        return type;
    }

    /* ------------------------------------------- */

    buildHTML() {

        // Toggle type-specific template
        var obj = this.obj;
        var type = obj.data.info.type.current || "note";
        var html = FTC.template.load(this.template.replace("{type}", type));

        // Inject content templates
        $.each(this.parts, function(name, path) {
            html = FTC.template.inject(html, name, path);
        });
        return html;
    }

    /* ------------------------------------------- */

    editOwnedItem(owner, collection, index) {

        // Create a new application window for editing an item and associate it with the working data
        var newApp = sync.newApp("ui_renderItem");
        this.obj.addApp(newApp);

        // Create an HTML frame containing the app
        var frame = $('<div class="edit-item flex flexcolumn">');
        newApp.appendTo(frame);

        // Attach a full-width confirmation button listen for submission
        var item = this.data;
        var confirm = $('<button class="fit-x">Update Item</button>');
        confirm.click(function () {
            collection[index] = item;
            owner.sync("updateAsset");
            layout.coverlay("edit-item");
        });
        frame.append(confirm);

        // Create the UI element
        ui_popOut({
            target: this.app,
            id: "edit-item",
            maximize: true,
            minimize: true,
            style: {"width": assetTypes["i"].width, "height": assetTypes["i"].height}
        }, frame).resizable();
    }
}

/* -------------------------------------------- */
/* Override Default Item Sheet Size             */
/* -------------------------------------------- */
hook.add("FTCInit", "Items", function() {
    assetTypes['i'].width = "650px";
    assetTypes['i'].height = "500px";
});

/* -------------------------------------------- */
/* Character Sheet Sync Render                  */
/* -------------------------------------------- */

sync.render("ui_renderItem", function(obj, app, scope) {
    var item = new FTCItem(obj, app, scope);
    return item.renderHTML();
});

/* -------------------------------------------- */

hook.add("OnDropCharacter", "FTCOnDrop", function(obj, app, scope, dt) {
    var item = JSON.parse(dt.getData("OBJ"));
    if (item._t !== "i") return;
    if (!item.info.type) return;

    // Make sure spells go to the right place
    if ((item.info.type.current === "spell") && !(dt.getData("spell") || item.tags["spell"])) {
        obj.data.inventory.pop();
        obj.data.spellbook.push(item);
        obj.sync("updateAsset");
    }

    // Make sure abilities go to the right place
    if (item.info.type.current === "ability") {
        obj.data.inventory.pop();
        obj.data.abilities.push(item);
        obj.sync("updateAsset");
    }
});

/* -------------------------------------------- */
