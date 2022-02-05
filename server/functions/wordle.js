module.exports = {
    /**
     * Process a Wordle guess.
     * @param {number} guess player's guess
     * @param {string} word word to guess
     * @param {Array} valid_guesses valid words to guess
     * @returns {Array} returns empty array when guess is invalid
     */
    process_guess: function (guess, word, valid_guesses) {
        if (valid_guesses.indexOf(guess) == -1) { 
            return([]);
        }
    
        feedback = [];
        guess_split = guess.split("");
        word_split = word.split("");

        // fill in the greens first
        let greens = [];
        for (let pos = 0; pos < 5; pos++) {
            const this_letter = guess_split[pos];
            if (this_letter == word_split[pos]) {
                greens.push(this_letter)
                feedback[pos] = 2;
            }
        }
        
        // now the yellows and grays
        for (let pos = 0; pos < 5; pos++) {
            const this_letter = guess_split[pos];
            
            if (feedback[pos] != 2) { // don't alter greens

                // letter in the wrong position
                let yellows = [];
                if (word_split.indexOf(this_letter) != -1 && feedback[pos] != 2) {

                    // letter hasn't already been guessed enough times in the yellows (before only) or in the greens (before and after)
                    if (functions.countOccurrences(yellows, this_letter) + functions.countOccurrences(greens, this_letter) >= functions.countOccurrences(word_split, this_letter)) {
                        feedback[pos] = 0;

                    } else {
                        yellows.push(this_letter)
                        feedback[pos] = 1;
                    }

                } else { // letter not in the word
                    feedback[pos] = 0;
                }
            }
        }
        return(feedback);
    }
}
