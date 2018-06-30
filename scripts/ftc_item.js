/* ------------------------------------------- */
/* Item Object Type                            */
/* ------------------------------------------- */

class FTCItem extends FTCObject {

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
        let type = this.data.info.type.current;
        return FTC.TEMPLATE_DIR + 'items/item-{type}.html';
    }

    get parts() {
        return {
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

    enrichData(data) {

        // Temporary FTC display data
        data.ftc = data.ftc || {};

        // Classify data type
        let type = this.classify_type(data, this.scope);
        data.info.type = type;
        data.ftc.typeStr = util.contains(["spell", "ability"], type.current) ? type.current.capitalize() : "Item";

        // Default Image
        data.info.img.current = data.info.img.current || "/content/icons/Pouch1000p.png";

        // Collapse tags
        data.info.tagstr = Object.keys(data.tags || {}).join(", ");

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
        if (i.info.type && i.info.type.current) return i.info.type;
        const type = {"name": "Entry Type", "current": "note"};

        // Provided by scope
        if ( this.scope.type ) {
            type.current = this.scope.type;
            return type;
        }
        else if ( this.scope.container ) {
            if ( this.scope.container === "spellbook" ) type.current = "spell";
            else if ( this.scope.container === "abilities" ) type.current = "ability";
            return type;;
        }

        // Implied by tags
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

    buildHTML(data) {

        // Toggle type-specific template
        let type = data.info.type.current || "note",
            html = FTC.loadTemplate(this.template.replace("{type}", type));

        // Inject content templates
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
        // If the item has an owner, don't bother trying to save the asset
        if ( this.scope.owner ) return;
        super.save();
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
