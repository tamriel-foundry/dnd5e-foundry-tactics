hook.add("FTCInit", "Forms", function() {
FTC.forms = {}

/* -------------------------------------------- */
/* Delayed Input Updating                       */
/* -------------------------------------------- */
FTC.forms.delayedUpdate = function(entity, ms) {
    setTimeout(function() {
        let isInput = $(document.activeElement).is(".ftc-edit, .ftc-checkbox, .ftc-select, .ftc-textarea");
        if ( !isInput ) {
            entity.save();
        }
    }, ms || 250);
};


/* -------------------------------------------- */
/* Text Input Fields                            */
/* -------------------------------------------- */

FTC.forms.edit_value_fields = function(html, entity) {
    /* Handle HTML <input> fields with class ftc-edit */

    // Record Starting Values
    const inputs = html.find("input.ftc-edit");
    inputs.each(function() {
       $(this).attr("data-initial", $(this).val());
    });

    // Initialize Input Width
    inputs.filter('[data-autosize]').each(function() { FTC.forms.autosize($(this)); });

    // Handle Input Updates
    inputs.blur(function() {
        let input = $(this),
            ms = input.parent().is("h1") ? 50 : undefined;
        if ( input.val() === input.attr("data-initial") ) return;
        entity.setData(input.attr('data-edit'), input.val(), input.attr('data-dtype'));
        FTC.forms.delayedUpdate(entity, ms);
    }).keyup(function(e) {
        if (e.which === 13) $(this).blur();
        FTC.forms.autosize($(this));
    });
};

FTC.forms.autosize = function(field) {
    if ( field.attr("data-autosize") ) {
        field.css("width", ((field.val().length + 1) * field.attr('data-autosize')));
    }
};



/* -------------------------------------------- */
/* Textarea Fields                              */
/* -------------------------------------------- */

FTC.forms.edit_textarea_fields = function(html, entity) {
    /* Handle HTML <textarea> field updates
    */

    const inputs = html.find("textarea.ftc-textarea");
    inputs.blur(function() {
        let input = $(this);
        entity.setData(input.attr('data-edit'), input.val(), input.attr('data-dtype'));
        FTC.forms.delayedUpdate(entity);
    });
};


/* -------------------------------------------- */
/* Checkbox Input Fields                        */
/* -------------------------------------------- */

FTC.forms.edit_checkbox_fields = function(html, entity) {
    /* Handle HTML <input> fields with class ftc-checkbox
    */

    // Set up checkboxes
    const boxes = html.find('input.ftc-checkbox');
    boxes.each(function(){
        let box = $(this);
        if (box.val() === "1") box.prop("checked", true);
    });

    // Set data updates on change
    boxes.change(function(){
        let box = $(this),
            val = box.prop("checked") + 0 || 0;
        entity.setData(box.attr("data-edit"), val, "int");
        entity.save();
    });
};


/* -------------------------------------------- */
/* Select Input Fields                          */
/* -------------------------------------------- */

FTC.forms.edit_select_fields = function(html, entity) {
    /* Handle HTML <select> fields with class ftc-select
    */

    // Populate their initial status
    const selects = html.find("select.ftc-select");
    selects.each(function() {
        let select = $(this);
        let val = select.attr("data-selected");
        select.children("option").each(function() {
            let opt = $(this);
            if (opt.val() === val) opt.attr("selected", 1);
            else opt.removeAttr("selected");
        });
    });

    // Set data and update immediately on change
    selects.change(function() {
        let select = $(this),
            value = select.find(":selected").val();
        entity.setData(select.attr('data-edit'), value, "str");
        entity.save();
    });
};


/* -------------------------------------------- */
/* Edit Sheet Image Handler                     */
/* -------------------------------------------- */

FTC.forms.edit_image_fields = function(html, entity, app) {
    html.find('.profile-image.ftc-image').click(function(){
        let key = $(this).attr('data-edit'),
            obj = entity.obj;

        // Create Image Picker
        let imgList = sync.render("ui_filePicker")(obj, app, {
            filter : "img",
            change : function(ev, ui, value){
                entity.setData(key, value, "img");
                entity.save();
                layout.coverlay("icons-picker");
            }
        });

        // Toggle Display
        let pop = ui_popOut({
            target : $(this),
            prompt : true,
            id : "icons-picker",
            align : "top",
            style : {"width" : assetTypes["filePicker"].width, "height" : assetTypes["filePicker"].height}
        }, imgList);
        pop.resizable();
      });
};


/* -------------------------------------------- */
/* Edit Rich Text Field                         */
/* -------------------------------------------- */

FTC.forms.edit_mce_fields = function(html, entity, app) {
    html.find('.ftc-textfield-edit').click(function(){
        const div = $(this).siblings('.ftc-textfield'),
            target = div.attr('data-edit'),
            selector = app.attr("id") + "-" + div.attr("id"),
            height = div.attr("data-mce-height") || "350";

        // Give the edit div a unique ID
        div.attr("id", selector);

        // Make sure the editor isn't already in use
        if ( tinymce.editors[selector] ) tinymce.editors[selector].destroy();

        // Create MCE Editor
        $(this).css("display", "none");
        let mce = tinyMCE.init({
            selector: "#"+selector,
            branding: false,
            menubar: false,
            statusbar: false,
            resize: false,
            height: height,
            auto_focus: selector,
            plugins: 'lists save code',
            toolbar: 'bold italic underline bullist numlist styleselect removeformat code save',
            content_css: "css/ftc_mce.css",
            setup: function(ed) {  app._mce = ed; },
            save_enablewhendirty: false,
            save_onsavecallback: function(ed) {
                entity.setData(target, ed.getContent(), "str");
                entity.save();
                ed.remove();
                ed.destroy();
                $(this).css("display", "block");
            }
        });
    });

    // Schedule Editor Cleanup
    app.on("remove", function() {
        if ( app._mce ) app._mce.destroy();
    });
};

/* -------------------------------------------- */
/* Edit Inventory and Spell Buttons             */
/* -------------------------------------------- */

FTC.forms.edit_item_fields = function(html, character) {

    // Add Item
    html.find('.ftc-item-add').click(function() {
        let controls = $(this).closest(".item-header"),
            list = controls.next(".item-list").length ? controls.next(".item-list") : controls.prev(".item-list"),
            container = list.attr("data-item-container"),
            data = duplicate(game.templates.item);

        // Initial data
        data.info.type.current = list.attr("data-item-type");
        data.info.variety.current = list.attr("data-item-variety");

        // Create owned item
        let item = new FTCItem(data, {"owner": character, "container": container});
        item.editOwnedItem();
    });

    // Edit Item
    html.find('.item-list .item-edit').click(function() {
        const li = $(this).closest("li"),
            itemId = li.attr("data-item-id"),
            container = li.parent().attr("data-item-container"),
            item = new FTCItem(character.data[container][itemId], {"owner": character, "container": container});
        item.editOwnedItem(itemId);
    });

    // Delete Item
    html.find('.item-list .item-trash').click(function() {
        const li = $(this).closest("li"),
            itemId = li.attr("data-item-id"),
            container = li.parent().attr("data-item-container");
        li.slideUp(200, function() { $(this).remove(); });
        character.deleteItem(container, itemId);
    });
};


/* -------------------------------------------- */
/* Activate All Form Fields                     */
/* -------------------------------------------- */

FTC.forms.activateFields = function(html, entity, app) {
    this.edit_value_fields(html, entity, app);
    this.edit_textarea_fields(html, entity, app);
    this.edit_select_fields(html, entity, app);
    this.edit_image_fields(html, entity, app);
    this.edit_checkbox_fields(html, entity, app);
    this.edit_mce_fields(html, entity, app);
    this.edit_item_fields(html, entity, app);
};

// End FTCInit
});
