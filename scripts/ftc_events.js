hook.add("FTCInit", "Events", function() {
FTC.events = {

    /* -------------------------------------------- */
    /* Edit Binary Checkbox Fields                  */
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
                val = $(this).prop('checked') | 0;
            FTC.setProperty(obj, key, val, "updateAsset");
        });
    },

    /* -------------------------------------------- */
    /* Edit Simple Text Fields                        */ 
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
    /* Edit Sheet Image Handler                        */ 
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

    /* Edit Actions for Inventory Fields */
    edit_item_fields: function(html, obj, app) {

        /* Edit Item */
        html.find('.item .item-edit').click(function() {
            var itemid = $(this).parent().attr("data-item-id");
            FTC.items.edit_item(app, obj, itemid);
        });

        /* Delete Item */
        html.find('.item .item-trash').click(function() {
            var itemid = $(this).parent().attr("data-item-id");
            obj.data.inventory.splice(itemid, 1);
            obj.sync("updateAsset");
        });
    },

    /* Edit Actions for Spellbook Fields */
    edit_spell_fields: function(html, obj, app) {
        html.find('.spell-trash').click(function() {
            var spellid = $(this).parents(".spell").attr("id").split("-")[1];
            obj.data.spellbook.splice(spellid, 1);
            obj.sync("updateAsset");
        })
    }
};

// End FTCInit
});
