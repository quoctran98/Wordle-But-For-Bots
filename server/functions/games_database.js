module.exports = {
    /**
     * Find a game document.
     * @param {number} game_token 
     * @returns {Game}
     */
    find_game: async function(game_token) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.active_games_collection).findOne({game_token: game_token}, function (err, this_game) {
                    // TODO add a check to see if this_game is null
                    if (err) {throw err;}
                    db.close();
                    resolve(this_game);
                });
            });
        });
    },

    /**
     * Save a game document.
     * @param {Game} game_object
     * @returns {boolean} 
     */
    save_game: async function (game_object) {
        const game_token = game_object.game_token;
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.active_games_collection).replaceOne({game_token: game_token}, game_object)
                .then(function () {
                    db.close();
                    resolve(true);
                });
            });
        });
    },

    /**
     * Create a new game document.
     * @param {Game} game_object
     * @returns {boolean} database_status
     */
    create_game: async function (game_object) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.active_games_collection).insertOne(game_object, function(err, mongo_result) {
                    if (err) {throw err;}
                    db.close();
                    resolve(true);
                });
            });
        });
    },

    /**
     * Archive a game document for a finished game. And remove it from the active_games collection
     * @param {Game} game_object
     * @returns {boolean} database_status
     */
     archive_game: async function (game_object) {
        const game_token = game_object.game_token;
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.archived_games_collection).insertOne(game_object)
                .then(function() {
                    dbo.collection(config.mongo.active_games_collection).deleteOne({game_token: game_token})
                    .then(function () {
                        db.close();
                        resolve(true);
                    });
                });
            });
        });
    }
}