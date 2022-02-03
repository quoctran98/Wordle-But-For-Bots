module.exports = {
    /**
     * Save the score of a finished Wordle game for the player -- does not touch either active or archived games collection
     * @param {Game} game_object completed game object
     * @returns {boolean} success
     */
    save_score: async function (game_object) {
        const game_token = game_object.game_token;
        const player_id = game_object.player_id;
        const time_ended = game_object.guess_times[game_object.guess_times.length - 1];

        let score = 0; // 0 is forfeit
        return new Promise((resolve) => {
            if (game_object.won) {
                score = game_object.guesses.length;
            } else if (game_object.forfeit) {
                score = valid_solutions.length; // penalty for forfeiting, I guess
            } else {
                resolve(false);
            }

            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);

                dbo.collection(config.mongo.players_collection).findOne({player_id: player_id}, function (err, player_info) {
                    if (err) {throw err;}
                    player_info.scores.push(score);
                    player_info.score_times.push(Date.now());

                    dbo.collection(config.mongo.players_collection).replaceOne({player_id: player_id}, player_info)
                    .then(function () {
                        db.close();
                        resolve(true);
                    });
                });
            });
        });
    },

    /**
    * Get a compiled report of scores
    * @returns {[Score]} array of score objects
    */
    compile_scores: async function () {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.players_collection).find({active: true}).toArray(function(err, active_players) {
                    if (err) {throw err;}
                    db.close();
                    let active_player_scores = [];
                    active_players.forEach(function(this_player) {
                        active_player_scores.push({
                            "player_name": this_player.player_name,
                            "mean_score": ((this_player.scores.length == 0) ? NaN : functions.array_mean(this_player.scores)),
                            "games_played": this_player.scores.length,
                            "time_registered": this_player.time_registered
                        })
                    });
                    resolve(active_player_scores);
                });
            });
        });
    }
}
