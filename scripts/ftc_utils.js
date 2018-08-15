

/* -------------------------------------------- */
/* String Utility Functions                     */
/* -------------------------------------------- */

String.prototype.capitalize = function() {
  if ( !this.length ) return this;
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.titleCase = function() {
  if (!this.length) return this;
  return this.toLowerCase().split(' ').map(function (word) {
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
  if (!insert && !overwrite) return original;

  // Maybe copy the original data
  original = ( inplace ) ? original : duplicate(original);

  // Iterate over the other object
  for (let k in other) {

    // Top-level object
    if (other[k] instanceof Object) {

      // Object exists in both original and other - handle recursively
      if (original.hasOwnProperty(k) && ( original[k] instanceof Object)) {
        mergeObject(original[k], other[k], insert, overwrite, inplace = true);
      }

      // Object exists only in other - only merge if insert is true
      else if (original[k] === undefined && insert) {
        original[k] = other[k];
      }
    }

    // Bottom-level value
    else {

      // Key exists in both original and other - only update if overwrite
      if (original.hasOwnProperty(k)) {
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
  $.each(cleaned, function (k, v) {
    if (allowPrivate && k.startsWith("_")) return;
    if (k instanceof Array) return;
    if (k instanceof Object) {
      if (template.hasOwnProperty(k)) cleanObject(k, template[k], true, allowPrivate);
      else delete cleaned[k];
    }
    else if (!template.hasOwnProperty(k)) delete cleaned[k];
  });
  return cleaned;
}


/* -------------------------------------------- */
