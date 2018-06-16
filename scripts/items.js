hook.add("FTCInit", "Items", function() {
FTC.items = {

    /* ------------------------------------------- */

    enrichItem: function(item, index) {
        /* Enrich an inventory item with additional data */

        // Maybe record it's inventory index
        if ( index !== undefined ) {
            item.itemid = index;
        }

        // Flag an item type
        type = "generic"
        if (item.weapon.damage.current !== undefined) {
            type = "weapon"
        } else if (item.spell.level.current !== undefined) {
            type = "spell"
        } else if (item.tags.armor === 1) {
            type = "armor"
        }
        item.itemtype = type;

        // Ensure default weight and quantity
        item.info.weight.current = parseFloat(item.info.weight.current || 0);
        item.info.quantity.current = parseInt(item.info.quantity.current || 1);

        // Return the item
        return item;
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


}

// End FTCInit
});
