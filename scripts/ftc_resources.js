hook.add("FTCInit", "Resources", function() {
FTC.resources = {

    TEMPLATE_PAGE_VIEW: FTC.TEMPLATE_DIR + 'resources/pageview.html',

    render_page: function(obj, app, scope) {

        // Configure default scope
        scope = scope || {viewOnly: (app.attr("viewOnly") == "true"), preview : (app.attr("preview") == "true")};

        // Load HTML
	    var html = FTC.template.load(this.TEMPLATE_PAGE_VIEW);
        html = FTC.template.populate(html, obj.data);
        return $(html);

    },
}

/* -------------------------------------------- */
/* Render Page Resource                         */
/* -------------------------------------------- */
// sync.render("ui_renderPage", function(obj, app, scope) {
//     return FTC.resources.render_page(obj, app, scope);
// });

// End FTC Init
});
