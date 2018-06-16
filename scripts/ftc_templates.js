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

    populate: function(html, data) {
        /*
        Populate an HTML template by embedding data into it from some provided object.

        Arguments:
            html: An HTML string
            data: An arbitrary data object
        */
        return html.replace(/\{([a-zA-Z\.]*)\}/g, function(match, attr){
            return FTC.getProperty(data, attr);
        });
    },
}

// End FTCInit
});
