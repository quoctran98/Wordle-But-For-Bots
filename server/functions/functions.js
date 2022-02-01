module.exports = {
    /**
     * Count occurences of a value in an array.
     * @param {Array} arr 
     * @param {} val 
     * @returns {number} number of times val appears in arr
     */
    // stolen from https://www.codegrepper.com/code-examples/javascript/javascript+count+number+of+occurrences+in+array
     countOccurrences: function (arr, val) {
        return(arr.reduce((a, v) => (v === val ? a + 1 : a), 0))
    },

    /**
     * Hash a string by whatever method this is
     * @param {string} string string to hash
     * @returns {number} the hash of the string
     */
    // stolen from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    hash_string: function (string) {
        var hash = 0, i, chr;
        if (string.length === 0) {
            return(hash);
        }
        for (i = 0; i < string.length; i++) {
          chr = string.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return(hash);
    },

    /**
     * Check if two arrays are equal in every element
     * @param {Array} a
     * @param {Array} b
     * @returns {boolean}
     */
    // stolen from https://flexiple.com/javascript-array-equality/
    array_equals: function (a, b) {
        return Array.isArray(a) &&
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((val, index) => val === b[index]);
    },

    /**
     * Find the mean of all elements in an array
     * @param {Array} array
     * @returns {number} mean
     */
    // stolen from https://stackoverflow.com/questions/29544371/finding-the-average-of-an-array-using-js
    array_mean: function (array) {
        return(array.reduce((a, b) => a + b) / array.length);
    }
}