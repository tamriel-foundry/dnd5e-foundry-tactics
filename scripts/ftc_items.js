hook.add("FTCInit", "Items", function() {
FTC.items = {

    TEMPLATE_ITEM_EDIT: FTC.TEMPLATE_DIR + 'items/item-edit.html',

    /* ------------------------------------------- */

    enrichItem: function(obj, scope) {
        /*
        Enrich an inventory item with additional data

        Arguments:
            obj: An item object or item data.
            scope: Customization options passed in to help configure the item.

        Returns:
            An object (if an object was initially provided) or item data (if only data was provided)
        */

        // Toggle object vs. data
        var isObject = ( '_uid' in obj ) &&  ( 'data' in obj ),
            obj = isObject ? obj : {"data": obj};

        // Create a place for temporary data
        var item = obj.data;
        item.ftc = item.ftc || {};

        // Maybe record it's inventory index
        scope = scope || {};
        if ( scope.inventory !== undefined ) {
            item.ftc.itemid = parseInt(scope.inventory);
        }

        // Collapse tags
        item.info.tagstr = Object.keys(item.tags || {}).join(", ");

        // Classify item type
        type = "generic"
        if (item.weapon.damage.current !== undefined) {
            type = "weapon"
        } else if (item.spell.level.current !== undefined) {
            type = "spell"
        } else if (item.tags.armor === 1) {
            type = "armor"
        }
        item.itemtype = type;

        // Ensure quantity, price, and weight
        item.info.price = item.info.price || {"name": "Price", "current": 0.0};
        $.each(["weight", "quantity", "price"], function(_, v) {
           item.info[v].current = parseFloat(item.info[v].current || 0.0)
        });


        // Return either the full object or just the item data
        return isObject ? obj : item;
    },

    /* ------------------------------------------- */

    edit_item: function (app, obj, index) {
        /*
        Edit an item from a character object's inventory. This will render a pop-out window using the ui_renderItem
        interface.

        Arguments:
            app: The character sheet application
            obj: The character object
            index: The positional index of the item in the character's inventory
        */

        // Create a working data object in game locals for later reference
        var item = obj.data.inventory[index];
        if ( item === undefined ) return;
        game.locals["editItem"] = game.locals["editItem"] || sync.obj("editItem");
        game.locals["editItem"].data = duplicate(item);

        // Create a new application window for editing an item and associate it with the working data
        var newApp = sync.newApp("ui_renderItem");
        game.locals["editItem"].addApp(newApp);

        // Create an HTML frame and attach it to the app
        var frame = $('<div class="edit-item flex flexcolumn">');
        newApp.appendTo(frame);

        // Create a Confirm button and listen for submission
        var confirm = $('<button class="fit-x">Update Item</button>');
        confirm.click(function () {
            console.log(game.locals['editItem']);
            obj.data.inventory[index] = game.locals["editItem"].data;
            obj.sync("updateAsset");
            layout.coverlay("edit-item");
        });
        frame.append(confirm);

        // Create the UI element
        ui_popOut({
            target: app,
            id: "edit-item",
            maximize: true,
            minimize: true,
            style: {"width": assetTypes["i"].width, "height": assetTypes["i"].height}
        }, frame).resizable();
    },

    /* ------------------------------------------- */

    create_item: function(ui_name, initial_data) {
        /*
        Create a new temporary item, rendering a UI element to edit the item. The item will not be saved as an asset,
        but the resulting object can be saved later by calling `runCommand("createItem", obj.data);`.

        Arguments:
            ui_name (str): The name of the UI element which should be already registered to sync.render
            initial_data (Object): Existing data with which to populate the object
        */

        // Create an object with initial data copied from the game template or provided by the user
        var obj = sync.obj();
        obj.data = duplicate(game.templates.item);
        if ( initial_data !== undefined ) {
            merge(obj.data, initial_data, true);
        }

        // Create an application DOM element
        ui_name = ui_name || "ui_renderItem";
        var app = sync.newApp(ui_name);
        obj.addApp(app);

        // Display the UI element
        var pop = ui_popOut({
            target : $('body'),
            prompt : true,
            id : "create-item",
            align : "top",
            style : {"width": 600, "height": 450},
        }, app);
        pop.resizable();

        // Return a reference
        return obj;
    },

    /* ------------------------------------------- */

    render_item: function(obj, app, scope) {

        // Configure Item Object
        FTC.item = obj;
        obj = this.enrichItem(obj, scope);

        // Load HTML
	    var html = this._renderItemHTML(obj, scope);

        // Activate Sheet Tabs
        FTC.ui.activate_tabs(html, obj, app);

        // Enable Edit Fields and Listeners
        FTC.events.edit_value_fields(html, obj, app);
        FTC.events.edit_image_fields(html, obj, app);
        FTC.events.edit_mce_fields(html, obj, app);
	    return html;
    },

    _renderItemHTML: function(obj, scope) {

        // Load templates
        var html = FTC.template.load(this.TEMPLATE_ITEM_EDIT);

        // Populate template
        html = FTC.template.populate(html, obj.data);
        return $(html);
    }
}


/* -------------------------------------------- */
/* Override Default Item Sheet Size             */
/* -------------------------------------------- */
//assetTypes['i'].width = "650px";
//assetTypes['i'].height = "500px";


// End FTCInit
});


/* -------------------------------------------- */
/* Character Sheet Sync Render                  */
/* -------------------------------------------- */

// sync.render("ui_renderItem", function(obj, app, scope) {
//     return FTC.items.render_item(obj, app, scope);
// });


