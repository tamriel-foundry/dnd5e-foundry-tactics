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

        // Temporary FTC display data
        item.ftc = item.ftc || {};

        // Default Image
        item.info.img.current = item.info.img.current || "/content/icons/Pouch1000p.png";

        // Collapse tags
        item.info.tagstr = Object.keys(item.tags || {}).join(", ");

        // Classify item type
        let type = this.classify_type(item);
        item.info.type = type;
        item.ftc.typeStr = util.contains(["spell", "ability"], type.current) ? type.current.capitalize() : "Item";

        // Ensure quantity, price, and weight
        item.info.price = item.info.price || {"name": "Price", "current": 0.0};
        $.each(["weight", "quantity", "price"], function(_, v) {
           item.info[v].current = parseFloat(item.info[v].current || 0.0)
        });

        // Return either the full object or just the item data
        return item;
    }

    /* ------------------------------------------- */

    refineScope(scope) {

        // Perhaps pre-seed the item with a specific type
        if (scope.type) this.data.info.type.current = scope.type;

        // Infer the default type based on an associated container
        if (scope.container) {
            if ( scope.container === "spellbook" ) this.data.info.type.current = "spell";
            else if ( scope.container === "abilities" ) this.data.info.type.current = "ability";
        }
        return scope
    }

    /* ------------------------------------------- */

    static classify_type(i) {
        if (i.info.type && i.info.type.current) return i.info.type;
        const type = {"name": "Entry Type", "current": "note"};
        if (("spell" in i.tags) || (i.spell && i.spell.level.current)) {
            type.current = "spell";
        } else if (("weapon" in i.tags) || (i.weapon && i.weapon.damage.current)) {
            type.current = "weapon";
        } else if (("armor" in i.tags) || (i.armor && i.armor.ac.current)) {
            type.current = "armor";
        } else if ("ability" in i.tags || "talent" in i.tags || (i.ability && i.ability.source.current)) {
            type.current = "ability";
        }
        return type;
    }

    /* ------------------------------------------- */

    buildHTML() {

        // Toggle type-specific template
        let obj = this.obj,
            type = obj.data.info.type.current || "note",
            html = FTC.loadTemplate(this.template.replace("{type}", type));

        // Inject content templates
        $.each(this.parts, function(name, path) {
            html = FTC.injectTemplate(html, name, path);
        });
        return html;
    }

    /* ------------------------------------------- */

    save(strategy) {

        // If the item has an owner, don't bother trying to save the asset
        if ( this.scope.owner ) return;
        super.save(strategy);
    }

    /* ------------------------------------------- */

    editOwnedItem(itemId) {

        // Get the owner, container, and item position
        const owner = this.scope.owner,
            container = this.scope.container;
        itemId = itemId || container.length;

        // Create a new application window for editing an item and associate it with the working data
        const newApp = sync.newApp("ui_renderItem", this.obj, this.scope);
        this.obj._apps.push(newApp);

        // Create an HTML frame containing the app
        const frame = $('<div class="edit-item flex flexcolumn">');
        newApp.appendTo(frame);

        // Attach a full-width confirmation button listen for submission
        const item = this.data,
            confirm = $('<button class="fit-x">Update Item</button>');
        confirm.click(function () {
            owner.updateItem(container, itemId, item);
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
        const item = JSON.parse(dt.getData("OBJ")) || {};
        if (item._t !== "i") return;
        if (!item.info.type) return;
        const type = item.info.type.current;

        // Inventory Items
        if (["weapon", "armor", "note"].includes(type)) {
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


convert_srd_spells = function() {
    const _convert = function(d) {
        let item = duplicate(game.templates.item),
            info = item.info,
            spell = item.spell,
            level = (d.level === "Cantrip") ? 0 : parseInt(d.level[0]);

        const prices = [10, 60, 120, 200, 320, 640, 1280, 2560, 5120, 10240];

        info.name.current = d.name;
        info.notes.current = (d.higher_level) ? d.desc + "<h3>Higher Levels</h3>" + d.higher_level : d.desc;
        info.type.current = "spell";
        info.weight.current = 0.10;
        info.price.current = prices[level];
        info.source.current = d.page;
        item.tags["Spell"] = 1;
        item.tags[d.school] = 1;

        spell.level.current = level;
        spell.school.current = d.school.toLowerCase();
        spell.duration.current = d.duration;
        spell.time.current = d.casting_time;
        spell.components.current = d.components;
        spell.materials.current = d.material;
        item.weapon.range.current = d.range;
        spell.ritual.current = (d.ritual === "yes") ? 1 : 0;
        spell.concentration.current = (d.concentration === "yes") ? 1 : 0;
        spell.classes.current = d.class;
        return item;
    };

    let data = $.get({
          url: "content/srd_spells.json",
          dataType: 'json',
          async: false
    }).responseText;
    data = JSON.parse(data);

    $.each(data, function(i, item) {
        runCommand("createItem", _convert(item));
    })
};
