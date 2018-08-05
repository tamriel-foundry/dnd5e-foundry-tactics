hook.add("FTCInit", "UI", function() {
FTC.ui = {

	/* Create a dialogue window */
	createDialogue: function(html, options) {
		const defaults = {
			resizable: false,
			height: "auto",
			width: 300,
			modal: true,
			closeText: "close",
			close: function(ev) {
				html.dialog("destroy");
			}
		};
		options = mergeObject(defaults, options, true, true);
		html.dialog(options);
		return html;
	},

    /* ------------------------------------------- */

	activateTabs: function(html, character) {

		// Record active tabs
		character.data.tabs = character.data.tabs || {};

		// Restore Active Tabs
		$.each(character.data.tabs, function(_, t) {
			let tab = html.find("#"+t);
			if (tab.length > 0) FTC.ui._switchTab(html, tab);
		});

		// Assign Listener
		html.find('.sheet-tab').click(function() {
			let container = $(this).parent().attr("id");
			FTC.ui._switchTab(html, $(this));
			character.data.tabs[container] = $(this).attr("id");
		});
	},

	_switchTab: function(html, tab) {
		var id = tab.attr("id"),
			content = html.find("#content-"+id.split("-")[1]);

		/* Set other tabs to inactive */
		tab.siblings('.sheet-tab').removeClass('tab-active');
		tab.addClass('tab-active');
		content.siblings('.content-tab').removeClass('tab-active');
		content.addClass('tab-active');
	},

	/* ------------------------------------------- */

    chatProperties: function(props) {
        let propStr = "";
        $.each(props, function(_, p) {
            if (p && p.length) propStr += `<span class="action-prop">${p}</span>`;
        });
        return propStr;
    }
};


// End FTCInit
});
