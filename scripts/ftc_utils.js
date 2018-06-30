

/* -------------------------------------------- */
/* String Utility Functions                     */
/* -------------------------------------------- */

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.titleCase = function() {
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


/* -------------------------------------------- */
/* Object Manipulations                         */
/* -------------------------------------------- */

function ftc_merge(original, other, insert=false, overwrite=true, inplace=false) {
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
                ftc_merge(original[k], other[k], insert, overwrite, inplace=true);
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
};


/* -------------------------------------------- */


function ftc_clean(original, template, inplace=false) {
    // Purge objects from the original which do not begin with "_" and do not exist in the template

    let cleaned = (inplace) ? original : duplicate(original);
    for (let k in cleaned) {
        if ( k.startsWith("_") ) continue;
        if ( cleaned[k] instanceof Object ) {
            if ( template.hasOwnProperty(k) ) ftc_clean(cleaned[k], template[k]);
            else delete cleaned[k];
        }
    }
    return cleaned;
}


/* -------------------------------------------- */


ftc_update_entities = function() {
    $.each(game.entities.data, function(_, obj) {
        if (obj.data._t === "i") ftc_update_entity(obj, game.templates.item);
        else if (obj.data._t === "c") ftc_update_entity(obj, game.templates.character);
    });
};


/* -------------------------------------------- */


ftc_update_entity = function(obj, template) {

    // Step 1 - merge any new template changes into the object data model
    let data = ftc_merge(obj.data, template, true, false, false);

    // Step 2 - delete data from the object which is no longer required by the data model
    data = ftc_clean(data, template, true);

    // Step 3 - Reassociate the data and save the object
    obj.data = data;
    obj.sync("updateAsset");
};


/* -------------------------------------------- */


ftc_update_template = function() {
    runCommand("updateTemplate", duplicate(game.locals.gameList[FTC_SYSTEM_IDENTIFIER]));
};

/* -------------------------------------------- */
