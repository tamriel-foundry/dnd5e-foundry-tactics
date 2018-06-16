hook.add("FTCInit", "UI", function() {
FTC.ui = {

	/* Create a dialogue window */
	_create_dialogue: function(title, html, buttons) {
		var dlg = $('<div class="ftc-dialog"></div>').html(html);
		dlg.dialog({
			title: title,
			resizable: false,
			height: "auto",
			width: 300,
			modal: true,
			closeText: "close",
			buttons: buttons,
			close: function(ev) { dlg.remove();	}
		});
		return dlg;
	},

	activate_tabs: function(html, obj, app) {

		/* Restore Active Tabs */
		for (var t in obj.data.ftc.tabs) {
			var tab = html.find("#"+obj.data.ftc.tabs[t]);
			if (tab.length > 0) FTC.ui._switch_tab(html, tab);
		}

		/* Assign Listener */
		html.find('.sheet-tab').click(function() {
			var container = $(this).parent().attr("id");
			FTC.ui._switch_tab(html, $(this));
			obj.data.ftc.tabs = obj.data.ftc.tabs || {};
			obj.data.ftc.tabs[container] = $(this).attr("id");
		});
	},

	_switch_tab: function(html, tab) {
		var id = tab.attr("id"),
			content = html.find("#content-"+id.split("-")[1]);

		/* Set other tabs to inactive */
		tab.siblings('.sheet-tab').removeClass('tab-active');
		tab.addClass('tab-active');
		content.siblings('.content-tab').removeClass('tab-active');
		content.addClass('tab-active');
	},

	cleanup_app: function(app) {
		$(app).on("remove", function() {

			/* Remove any unbound or associated MCE editors */
			for (var e in tinymce.editors) {
			    if (Number.isInteger(e) || e.toString().startsWith($(this).attr("id"))) {
			    	tinymce.editors[e].destroy();
			    }
			};
		});
	},

	/* Return an ordinal number from an integer, i.e. 1 => 1st, 2=> 2nd, etc... */
	getOrdinalNumber:function(n) {
	    var s=["th","st","nd","rd"],
	    v=n%100;
	    return n+(s[(v-20)%10]||s[v]||s[0]);
	},

	padNumber:function(num, digits) {
		/*
		Pad a number with leading zeroes for display purposes
		*/
		var s = "000000000" + num;
		return s.substr(s.length-digits);
	},
};

// End FTCInit
});
