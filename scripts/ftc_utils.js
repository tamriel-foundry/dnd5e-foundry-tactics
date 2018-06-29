

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
