

/* -------------------------------------------- */
/* String Utility Functions                     */
/* -------------------------------------------- */

String.prototype.capitalize = function() {
    if ( !this.length ) return this;
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.titleCase = function() {
    if ( !this.length ) return this;
    return this.toLowerCase().split(' ').map(function(word) {
        return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
};


/* -------------------------------------------- */
/* Number Utility Functions                     */
/* -------------------------------------------- */

Number.prototype.ordinalString = function() {
    let s=["th","st","nd","rd"],
        v=this%100;
    return this+(s[(v-20)%10]||s[v]||s[0]);
};

Number.prototype.paddedString = function(digits) {
    let s = "000000000" + this;
    return s.substr(s.length-digits);
};

Number.prototype.signedString = function() {
    return (( this < 0 ) ? "" : "+") + this;
};


/* -------------------------------------------- */
/* Object Manipulations                         */
/* -------------------------------------------- */

function mergeObject(original, other, insert=false, overwrite=true, inplace=false) {
    /*
    Update a source object by replacing its keys and values with those from a target object.

     Arguments:
        original (Object): The initial object which should be updated with values from the target
        other (Object): A new object whose values should replace those in the source
        insert (bool): Control whether to insert new parent objects in the structure which did not previously exist
            in the source object
        overwrite (bool): Control whether to replace existing values in the source, or only merge values which do not
            currently exist
        inplace (bool): Update the values of original inplace? Otherwise duplicate the original and return a safe copy

     Returns:
        (Object): The original source object including updated, inserted, or overwritten records
     */

    // Return directly if insert and overwrite are both false
    if ( !insert && !overwrite ) return original;

    // Maybe copy the original data
    original = ( inplace ) ? original : duplicate(original);

    // Iterate over the other object
    for (let k in other) {

        // Top-level object
        if ( other[k] instanceof Object) {

            // Object exists in both original and other - handle recursively
            if ( original.hasOwnProperty(k) && ( original[k] instanceof Object) ) {
                mergeObject(original[k], other[k], insert, overwrite, inplace=true);
            }

            // Object exists only in other - only merge if insert is true
            else if (original[k] === undefined && insert) {
                original[k] = other[k];
            }
        }

        // Bottom-level value
        else {

            // Key exists in both original and other - only update if overwrite
            if ( original.hasOwnProperty(k) ) {
                if (overwrite) original[k] = other[k];
            }

            // Key does not exist in original - only update if insert
            else {
                if (insert) original[k] = other[k];
            }
        }
    }

    // Return the object for use
    return original;
}


/* -------------------------------------------- */


function cleanObject(original, template, inplace=false, allowPrivate=true) {
    // Purge objects from the original which do not begin with "_" and do not exist in the template

    let cleaned = (inplace) ? original : duplicate(original);
    $.each(cleaned, function(k, v) {
        if (allowPrivate && k.startsWith("_")) return;
        if (k instanceof Array) return;
        if (k instanceof Object) {
            if (template.hasOwnProperty(k)) cleanObject(k, template[k], true, allowPrivate);
            else delete cleaned[k];
        }
        else if ( !template.hasOwnProperty(k) ) delete cleaned[k];
    });
    return cleaned;
}


/* -------------------------------------------- */


ftc_update_entities = function() {
    $.each(game.entities.data, function(_, obj) {
        if (obj.data._t === "i") {
            obj.data = ftc_update_entity(obj.data, game.templates.item);
            obj.sync("updateAsset");
        }
        else if (obj.data._t === "c") {
            obj.data = ftc_update_entity(obj.data, game.templates.character);
            obj.sync("updateAsset");
        }
    });
};


/* -------------------------------------------- */

ftc_update_entity = function(data, template) {

    // Step 1 - merge any new template changes into the object data model
    data = mergeObject(data, template, true, false, false);

    // Step 2 - delete data from the object which is no longer required by the data model
    data = cleanObject(data, template, true);
    return data
};


/* -------------------------------------------- */


ftc_update_template = function() {
    runCommand("updateTemplate", duplicate(game.locals.gameList[FTC_SYSTEM_IDENTIFIER]));
};

/* -------------------------------------------- */


ftc_updateCompendium = function(filename) {
    if ( !game.locals.workshop ) {
        console.log("Failure: You must first open the Compendium tab");
        return;
    }

    // Iterate over pack sections
    const pack = game.locals.workshop.data[filename];
    $.each(pack.data.content, function(name, section) {
        let type = section._t;
        $.each(section.data, function(i, data) {
            console.log("Updating compendium entry: " + data.info.name.current);
            if ( type === "i" ) section.data[i] = ftc_migrateElement(data, true);
            else if ( type === "c" ) section.data[i] = ftc_migrateActor(data, true);
        });
    });

    // Export the data to JSON and save
    runCommand("savePack", {key : filename, data : JSON.stringify(pack.data, 2, 2)});
    console.log("Successfully migrated compendium: " + filename)
};


ftc_updateWorld = function() {

    // Update game templates and apply new data models
    const template = duplicate(game.locals.gameList[FTC_SYSTEM_IDENTIFIER]);
    game.templates = template;
    FTCActor.applyDataModel();
    FTCElement.applyDataModel();

    // Iterate over game entities
    $.each(game.entities.data, function(_, obj) {
        let type = obj.data._t;
        if ( type === "i" ) {
            obj.data = ftc_migrateElement(obj.data, false);
            obj.sync("updateAsset");
            console.log("Updating element: " + obj.data.info.name.current);
        }
        else if ( type === "c" ) {
            obj.data = ftc_migrateActor(obj.data, false);
            obj.sync("updateAsset");
            console.log("Updating actor: " + obj.data.info.name.current);
        }
    });

    // Apply the game template update
    console.log("Successfully migrated world file to V2 template!");
    runCommand("updateTemplate", template);
};