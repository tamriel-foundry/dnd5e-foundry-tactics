hook.add("FTCInit", "Events", function() {
FTC.events = {

    /* -------------------------------------------- */
    /* Edit Input Fields                            */
    /* -------------------------------------------- */

    edit_value_fields: function(html, obj, app) {
        var inputs = html.find("input.ftc-edit");
        var _set_field_width = function(field) {
            field.css("width", ((field.val().length + 1) * field.attr('data-autosize')));
        };

        /* Initialize Input Width */
        inputs.filter('[data-autosize]').each(function() { _set_field_width($(this)); });

        /* Handle Input Updates */
        inputs.blur(function() {
            FTC.setProperty(obj, $(this).attr('data-edit'), $(this).val(), "updateAsset");
        }).keyup(function(e) {
            if (e.which === 13) {
                $(this).blur();
            } else if ( $(this).attr("data-autosize") !== undefined ) {
                _set_field_width($(this));
            }
        });
    },

    /* -------------------------------------------- */
    /* Edit Checkbox Fields                         */
    /* -------------------------------------------- */

    edit_checkbox_fields: function(html, obj, app) {

        /* Check boxes which have a value of 1 */
        var boxes = html.find('input.ftc-checkbox');
        boxes.each(function(){
            if ($(this).val() === "1") {
                $(this).prop('checked', true);
            }
        });

        /* Bind on-change listener */
        boxes.change(function(){
            var key = $(this).attr('data-edit'),
                val = $(this).prop('checked') + 0 || 0;
            FTC.setProperty(obj, key, val, "int");
        });
    },

    /* -------------------------------------------- */
    /* Edit Select Fields                           */
    /* -------------------------------------------- */

    edit_select_fields: function(html, obj, app) {

        // Find any select fields
        var selects = html.find("select.ftc-select");

        // Populate their initial status
        selects.each(function(_, select) {
            var select = $(this),
                val = select.attr("data-selected");
            select.children("option").each(function() {
                var opt = $(this);
                if (opt.val() === val) opt.attr("selected", 1);
                else opt.removeAttr("selected");
            });
        });

        // Bind change listener
        selects.change(function() {
           var key = $(this).attr('data-edit'),
               val = $(this).find(":selected").val();
           FTC.setProperty(obj, key, val, "str")
        });
    },


    /* -------------------------------------------- */
    /* Edit Sheet Image Handler                     */
    /* -------------------------------------------- */

    edit_image_fields: function(html, obj, app) {
        html.find('.ftc-image').click(function(){
            var key = $(this).attr('data-edit');

            /* Create Image Picker */
            var imgList = sync.render("ui_filePicker")(obj, app, {
                filter : "img",
                change : function(ev, ui, value){
                    FTC.setProperty(obj, key, value, "updateAsset");
                    layout.coverlay("icons-picker");
                }
            });

            /* Toggle Display */
            var pop = ui_popOut({
                target : $(this),
                prompt : true,
                id : "icons-picker",
                align : "top",
                style : {"width" : assetTypes["filePicker"].width, "height" : assetTypes["filePicker"].height}
            }, imgList);
            pop.resizable();
          });
    },

    /* -------------------------------------------- */
    /* Edit Rich Text Field                            */
    /* -------------------------------------------- */

    edit_mce_fields: function(html, obj, app) {
        html.find('.ftc-textfield-edit').click(function(){
            var div = $(this).siblings('.ftc-textfield'),
                   target = div.attr('data-edit'),
                   appid = app.attr("id"),
                   sel = appid + "-" + div.attr("id");

               /* Give the edit div a unique ID */
               div.attr("id", sel);

            /* Create MCE Editor */
            $(this).css("display", "none");
            mce = tinyMCE.init({
                selector: "#"+sel,
                branding: false,
                menubar: false,
                statusbar: false,
                resize: false,
                min_height: 250,
                height: 300,
                auto_focus: sel,
                plugins: 'lists save',
                toolbar: 'bold italic underline bullist numlist styleselect save',
                save_enablewhendirty: false,
                save_onsavecallback: function(mce) {
                    FTC.setProperty(obj, target, mce.getContent(), "updateAsset");
                    mce.remove();
                    $(this).css("display", "block");
                }
            });
        });
    },

    /* -------------------------------------------- */

    /* Edit Actions for Inventory Fields */
    edit_item_fields: function(html, obj, app) {

        /* Edit Item */
        html.find('.item-list .item-edit').click(function() {

            // Get Data
            const li = $(this).closest("li");
            const container = li.attr("data-item-container");
            const itemId = li.attr("data-item-id");

            // Prepare item for editing
            let itemData = duplicate(obj.data[container][itemId]),
                item = new FTCItem(itemData, app, {});

            // Edit the owned item
            item.editOwnedItem(obj, obj.data[container], itemId);
        });

        /* Delete Item */
        html.find('.item-list .item-trash').click(function() {

            // Get data
            const li = $(this).closest("li");
            const container = li.attr("data-item-container");
            const itemId = li.attr("data-item-id");

            // Delete item
            obj.data[container].splice(itemId, 1)
            obj.sync("updateAsset");
        });
    },

    /* -------------------------------------------- */

    activateFields: function(html, obj, app) {
        this.edit_value_fields(html, obj, app);
        this.edit_select_fields(html, obj, app);
        this.edit_image_fields(html, obj, app);
        this.edit_checkbox_fields(html, obj, app);
        this.edit_mce_fields(html, obj, app);
        this.edit_item_fields(html, obj, app);
    }
};

// End FTCInit
});
