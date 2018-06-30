hook.add("FTCInit", "Forms", function() {
FTC.forms = {}

/* -------------------------------------------- */
/* Delayed Input Updating                       */
/* -------------------------------------------- */
FTC.forms.delayedUpdate = function(obj, ms) {
    setTimeout(function() {
        let isInput = $(document.activeElement).is(".ftc-edit, .ftc-checkbox, .ftc-select");
        if ( !isInput ) {
            obj.save();
        }
    }, ms || 250);
};


/* -------------------------------------------- */
/* Text Input Fields                            */
/* -------------------------------------------- */

FTC.forms.edit_value_fields = function(html, obj) {
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
        obj.setData(input.attr('data-edit'), input.val(), input.attr('data-dtype'));
        FTC.forms.delayedUpdate(obj, ms);
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
/* Checkbox Input Fields                        */
/* -------------------------------------------- */

FTC.forms.edit_checkbox_fields = function(html, obj) {
    /* Handle HTML <input> fields with class ftc-checkbox */
    const boxes = html.find('input.ftc-checkbox');

    // Set up checkboxes
    boxes.each(function(){
        let box = $(this);
        if (box.val() === "1") box.prop("checked", true);
    });

    // Set data updates on change
    boxes.change(function(){
        let box = $(this),
            val = box.prop("checked") + 0 || 0;
        obj.setData(box.attr("data-edit"), val, "int");
    });

    // Save changes on blur
    boxes.blur(function(){
        FTC.forms.delayedUpdate(obj);
    });
};


/* -------------------------------------------- */
/* Select Input Fields                          */
/* -------------------------------------------- */

FTC.forms.edit_select_fields = function(html, obj) {
    /* Handle HTML <select> fields with class ftc-select */

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
        obj.setData(select.attr('data-edit'), value, "str");
        obj.save();
    });
};


/* -------------------------------------------- */
/* Edit Sheet Image Handler                     */
/* -------------------------------------------- */

FTC.forms.edit_image_fields = function(html, obj, app) {
    html.find('.ftc-image').click(function(){
        let key = $(this).attr('data-edit');

        // Create Image Picker
        let imgList = sync.render("ui_filePicker")(obj, app, {
            filter : "img",
            change : function(ev, ui, value){
                obj.setData(key, value, "img");
                obj.save();
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

FTC.forms.edit_mce_fields = function(html, obj, app) {
    html.find('.ftc-textfield-edit').click(function(){
        const div = $(this).siblings('.ftc-textfield'),
            target = div.attr('data-edit'),
            selector = app.attr("id") + "-" + div.attr("id");

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
            min_height: 250,
            height: 300,
            auto_focus: selector,
            plugins: 'lists save code',
            toolbar: 'bold italic underline bullist numlist styleselect removeformat code save',
            save_enablewhendirty: false,
            save_onsavecallback: function(ed) {
                obj.setData(target, ed.getContent(), "str");
                obj.save();
                ed.remove();
                ed.destroy();
                $(this).css("display", "block");
            }
        });
    });

    // Schedule Editor Cleanup
    app.on("remove", function() {
        $.each(tinymce.editors, function(_, ed) {
            if (!$("#"+ed.id).length) ed.destroy();
        });
    });
};

/* -------------------------------------------- */
/* Edit Inventory and Spell Buttons             */
/* -------------------------------------------- */

FTC.forms.edit_item_fields = function(html, obj, app) {

    // Add Item
    html.find('.ftc-item-add').click(function() {
       const container = $(this).attr("data-item-container"),
           data = duplicate(game.templates.item),
           item = new FTCItem(data, app, {"owner": obj, "container": container});
        item.editOwnedItem();
    });

    // Edit Item
    html.find('.item-list .item-edit').click(function() {
        const li = $(this).closest("li"),
            container = li.attr("data-item-container"),
            itemId = li.attr("data-item-id"),
            item = new FTCItem(obj.data[container][itemId], app, {"owner": obj, "container": container});
        item.editOwnedItem(itemId);
    });

    // Delete Item
    html.find('.item-list .item-trash').click(function() {
        const li = $(this).closest("li"),
            container = li.attr("data-item-container"),
            itemId = li.attr("data-item-id");
        obj.deleteItem(container, itemId);
    });
};


/* -------------------------------------------- */
/* Activate All Form Fields                     */
/* -------------------------------------------- */

FTC.forms.activateFields = function(html, obj, app) {
    this.edit_value_fields(html, obj, app);
    this.edit_select_fields(html, obj, app);
    this.edit_image_fields(html, obj, app);
    this.edit_checkbox_fields(html, obj, app);
    this.edit_mce_fields(html, obj, app);
    this.edit_item_fields(html, obj, app);
};

// End FTCInit
});
