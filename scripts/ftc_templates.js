hook.add("FTCInit", "Template", function() {
FTC.template = {

    /* Variables */
    root: FTC.ROOT_DIR + 'html/',

    /* ------------------------------------------- */

    load: function(path) {
        /*
        Load a template from the provided path, returning the HTML as a string.
        */
        return $.get({
          url: path,
          dataType: 'html',
          async: false
        }).responseText;
    },

    /* ------------------------------------------- */

    inject: function(html, target, template) {
        /*
        Inject a sub-template into parent HTML, given a target HTML comment and template path

        Arguments:
            html: An HTML string containing comments with the form <!-- TEMPLATE_NAME -->
            target: The constant name to replace, in this case TEMPLATE_NAME
            template: The path to the HTML template file to
        */
        var target = "<!-- "+target+" -->";
        if (html.includes(target) === false) return html;
        var content = FTC.template.load(template);
        html = html.replace(target, content)
        return html;
    },

    /* ------------------------------------------- */

    populate: function(html, data) {
        /*
        Populate an HTML template by embedding data into it from some provided object.

        Arguments:
            html: An HTML string
            data: An arbitrary data object
        */
        return html.replace(/{([\w.]+)}/g, function(match, attr) {
            var val = FTC.getProperty(data, attr);
            return (val !== undefined) ? val : "";
        });
    },
}

// End FTCInit
});
