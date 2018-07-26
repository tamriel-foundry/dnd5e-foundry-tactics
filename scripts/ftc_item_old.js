

/* ------------------------------------------- */
/* Item Object Type                            */
/* ------------------------------------------- */

class FTCItem extends FTCEntity {


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
}

/* -------------------------------------------- */
