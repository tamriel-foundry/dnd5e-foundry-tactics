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
        console.log("Foundry Tactics | Mod enabled and loaded!");
    },

    /* ------------------------------------------- */

    TEMPLATE_CACHE: {},

    loadTemplate: function(path) {
        /*
        Load a template from the provided path, returning the HTML as a string.
        */

        // Cached template
        if ( path in this.TEMPLATE_CACHE ) return this.TEMPLATE_CACHE[path];

        // Load and cache
        const html = $.get({
          url: path,
          dataType: 'html',
          async: false
        }).responseText;
        this.TEMPLATE_CACHE[path] = html;
        console.log(`Foundry Tactics | Stored template ${path} to cache.`);
        return html;
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

        if ( !target || !template ) return html;
        target = "<!-- "+target+" -->";
        if (html.includes(target) === false) return html;

        const content = this.loadTemplate(template);
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

        // Sanitize target value
        value = FTC.cleanValue(value, dtype);

        // Get the data target
        let [target, key] = FTC.getTargetKey(data, name);
        if ( !target || !key ) return;

        // Set the value if it is defined
        if (value !== undefined && value !== "") target[key] = value;
        else delete target[key];
    },

    /* ------------------------------------------- */

    debug: {}
};


// An Prototypical Pattern for Rendering Rich Object Templates
class FTCEntity {

    constructor(object, context) {
        /*
         FTC Entity Constructor
         Accepts a sync.object or just the underlying data
         */

        // Record context
        this.context = context || {};

        // Store a reference to the app once rendered
        this.app = undefined;

        // Case 1: Sync Object provided
        if ( object.sync ) {
            this.obj = object;
            this.data = object.data;
        }

        // Case 2: Just Data
        else {
            this.data = object;
        }

        // A flag to record whether the data has been changed
        this._changed = false;

        // Initial data conversion steps
        this.data = this.convertData(this.data);

        // Save a reference to the active entity for debugging purposes
        FTC.debug[this.type] = this;
    }

    /* ------------------------------------------- */

    convertData(data) {
        return data
    }

    /* ------------------------------------------- */

    get id() {
        return ( this.obj ) ? this.obj.id() : undefined;
    }

    get name() {
        return this.data.info.name.current;
    }

    get img() {
        return this.data.info.img.current;
    }

    get type() {
        return this.data._type;
    }

    /* ------------------------------------------- */

    get canView() {
        return hasSecurity(getCookie("UserID"), "Visible", this.data);
    }

    get isOwner() {
        return hasSecurity(getCookie("UserID"), "Owner", this.data);
    }

    /* ------------------------------------------- */

    getData(name) {
        FTC.getProperty(this.data, name);
    }

    setData(name, value, dtype) {
        FTC.setProperty(this.data, name, value, dtype);
        this._changed = true;
    }

    save() {
        if (!this.obj || !this._changed) return;
        console.log(this.name + " | Saved entity to world file.");
        this._changed = false;
        this.obj.sync("updateAsset");
    }

    /* ------------------------------------------- */
    /* Rendering                                   */
    /* ------------------------------------------- */

    render(app, scope) {
        /* Standard entity rendering logic */

        let self = this;
        let timer = performance.now();
        this.app = app;

        // Step 1: Handle the provided scope
        scope = this.refineScope(scope);

        // Step 2: Refine and enrich the entity data for rendering
        let data = duplicate(this.data);
        data = this.enrichData(data, scope)

        // Step 3: Build the raw HTML
        let html = this.buildHTML(data, scope);

        // Step 4: Populate HTML using data
        html = this.populateHTML(html, data);

        // Step 5: Convert to jQuery
        html = $(html);

        // Step 6: Activate Event Listeners
        this.activateListeners(html, app, scope);

        // Step 7: Sechedule Cleanup Actions
        app.on("remove", function() { self.cleanup(scope); });

        // Return the final HTML
        let time = Math.round((performance.now() - timer) * 100) / 100;
        console.log(this.name + ' | Rendered HTML in ' + time + 'ms.');
        return html;
    }

    /* ------------------------------------------- */

    refineScope(scope) {
        return scope;
    }

    /* ------------------------------------------- */

    enrichData(data, scope) {
        return data;
    }

    /* ------------------------------------------- */

    buildHTML(data, scope) {
        throw "Foundry Tactics | A FTCEntity subclass must implement the buildHTML method.";
    }

    /* ------------------------------------------- */

    populateHTML(html, data) {
        return FTC.populateTemplate(html, data);
    }

    /* ------------------------------------------- */

    activateListeners(html, app, scope) {
    }

    /* ------------------------------------------- */

    cleanup(scope) {
        if ( this._changed ) this.save();
    }
}


/* -------------------------------------------- */
/* GM Forge Initialization Hook                 */
/* -------------------------------------------- */

hook.add("Initialize", "FTCSetup", function(...args) {
    let gameid = game.templates.identifier;

    // Only initialize FTC if we are using the correct system OR no system at all
    if ( gameid === FTC_SYSTEM_IDENTIFIER ) FTC.init();
    else console.log("Foundry Tactics | Mod enabled but not active for system " + gameid);
});

