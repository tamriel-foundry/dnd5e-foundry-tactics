const FTC_PACKAGE_NAME = "dnd5e-foundry-tactics";
const FTC_SYSTEM_IDENTIFIER = 'dnd5e_ftc';

/* ------------------------------------------- */
/* FTC GLOBALS AND UTILITY FUNCTIONS            */
/* ------------------------------------------- */
const FTC = {

    ROOT_DIR: 'workshop/'+FTC_PACKAGE_NAME+'/',
    TEMPLATE_DIR: 'workshop/'+FTC_PACKAGE_NAME+'/html/',
    CSS_DIR: 'workshop/'+FTC_PACKAGE_NAME+'/css/',

    /* ------------------------------------------- */

    init: function() {
        hook.call("FTCInit");
        $('body').append('<link rel="stylesheet" href="'+ FTC.CSS_DIR + 'FTC.css" type="text/css" />');
        console.log("D&D5e Foundry Tactics Loaded");
    },

    /* ------------------------------------------- */

    loadTemplate: function(path) {
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

    injectTemplate: function(html, target, template) {
        /*
        Inject a sub-template into parent HTML, given a target HTML comment and template path

        Arguments:
            html: An HTML string containing comments with the form <!-- TEMPLATE_NAME -->
            target: The constant name to replace, in this case TEMPLATE_NAME
            template: The path to the HTML template file to
        */
        var target = "<!-- "+target+" -->";
        if (html.includes(target) === false) return html;
        var content = this.loadTemplate(template);
        html = html.replace(target, content)
        return html;
    },

    /* ------------------------------------------- */

    populateTemplate: function(html, data) {
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

    /* ------------------------------------------- */

    getProperty: function(object, name) {
        /*
        Get object data by name with the format "part1.part2.part3" which would evaluate as obj[part1][part2][part3].
        If any of the requested parts are undefined, this method returns undefined.

        Arguments:
            object: The data object to traverse
            name: The composite property name to search for
        */
        let parts = name.split("."),
            data = object;
        for (let i = 0; i < parts.length; i++) {
            data = data[parts[i]];
            if (data === undefined) {
                break;
            }
        }
        return data;
    },

    /* ------------------------------------------- */

    cleanValue: function(value, dtype) {

        // Strings
        if ( dtype === "str" ) {
            value = value.valid();
        }

        // Tags - comma separated list
        else if ( dtype === "tags" ) {
            let tags = {};
            $.each(value.replace(" ", "").split(','), function(_, tag) {
               tags[tag] = 1;
            });
            value = tags;
        }

        // Integers
        else if ( util.contains(["int", "posint"], dtype) ) {
            value = parseInt((typeof(value) === "number") ? value : value.split(',').join(''));
            if ( dtype === "posint" )  value = Math.max(value, 0);
        }

        // Floats
        else if ( util.contains(["float", "posfloat"], dtype) ) {
            value = parseFloat((typeof(value) === "number") ? value : value.split(',').join(''));
            if ( dtype === "posfloat" ) value = Math.max(value, 0);
        }

        // Return cleaned value
        return value;
    },

    /* ------------------------------------------- */

    getTargetKey: function(data, name) {
        let parts = name.split("."),
              key = parts.pop() || "",
             part = undefined;
        for (let i = 0; i < parts.length; i++) {
            part = parts[i];
            if ( !data[part] ) return [{}, key];
            data = data[part];
        }
        return [data, key];
    },

    /* ------------------------------------------- */

    setProperty: function(data, name, value, dtype) {

        // TODO: Temporary dtype assignment
        if ( name === "tags" ) dtype = dtype || "tags";
        if ( name.startsWith("stats.") ) dtype = dtype || "posint";
        if ( name.startsWith("counter") ) dtype = dtype || "posint";

        // Sanitize target value
        value = FTC.cleanValue(value, dtype);

        // Get the data target
        console.log(FTC);
        let [target, key] = FTC.getTargetKey(data, name);
        if ( !target || !key ) return;

        // Set the value if it is defined
        if (value !== undefined && value !== "") target[key] = value;
        else delete target[key];
    }
};


// An Prototypical Pattern for Rendering Rich Object Templates
class FTCObject {

    constructor(obj, app, scope) {
        this.obj = this.enrichObject(obj);
        this.app = app;
        this.scope = this.refineScope(scope);
        this.changed = false;
        FTC.object = this;
    }

    /* ------------------------------------------- */

    enrichObject(obj) {
        if ( "sync" in obj ) {
            obj.data = this.constructor.enrichData(obj.data);
        } else {
            const data = this.constructor.enrichData(obj);
            obj = sync.obj();
            obj.data = data;
        }
        return obj;
    }

    /* ------------------------------------------- */

    static enrichData(data) {
        /*
        Enrich object data by augmenting it with additional metadata and attributes

        Arguments:
            data: Object data to augment and enrich.

        Returns:
            Enriched object data.
        */
        return data;
    }

    /* ------------------------------------------- */

    refineScope(scope) {
        return scope;
    }

    /* ------------------------------------------- */

    get data() {
        return this.obj.data;
    }

    get name() {
        return this.obj.data.info.name.current;
    }

    /* ------------------------------------------- */

    getData(name) {
        FTC.getProperty(this.data, name);
    }

    /* ------------------------------------------- */

    setData(name, value, dtype) {
        FTC.setProperty(this.data, name, value, dtype);
        this.changed = true;
    }

    /* ------------------------------------------- */

    save(strategy) {
        /*
        Sync the object, saving updated data and refreshing associated UI elements.
        Remove temporary data and save.
        */

        if ( !this.changed ) return;
        console.log("Saving object " + this.name+ " with strategy " + strategy);
        delete this.obj.data.ftc;
        this.obj.sync(strategy);
    }

    /* ------------------------------------------- */

    renderHTML() {

        // Build Template and Populate Data
        let html = this.buildHTML();
        html = this.populateHTML(html);
        this.html = $(html);

        // Activate Tabs
        FTC.ui.activate_tabs(this.html, this.obj, this.app);

        // Activate Fields
        FTC.forms.activateFields(this.html, this, this.app);

        // Enable Clickable Sheet Actions
        FTC.actions.activateActions(this.html, this.obj, this.app);

        // Sechedule Cleanup Actions
        FTC.ui.cleanup_app(this.app);

        // Return final HTML
        return this.html;
    }

    buildHTML() {
        return "<div>{info.name.current}</div>";
    }

    populateHTML(html) {
        return FTC.populateTemplate(html, this.obj.data);
    }
}


/* -------------------------------------------- */
/* GM Forge Initialization Hook                 */
/* -------------------------------------------- */

hook.add("Initialize", "FTCSetup", function(...args) {
    let gameid = game.templates.identifier;

    // Only initialize FTC if we are using the correct system OR no system at all
    if ( gameid === FTC_SYSTEM_IDENTIFIER ) FTC.init();
    else console.log("Foundry Tactics installed but not loaded for system: " + gameid);
});
