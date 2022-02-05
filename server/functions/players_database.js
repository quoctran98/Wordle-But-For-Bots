module.exports = {
    /**
     * Check to see if registration key exists and if it hasn't exceeded the limit of active players
     * @param {string} registration_key 
     * @returns {Boolean}
     */
     check_registration_key: async function(registration_key) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.registration_keys_collection).findOne({key: registration_key}, function(err, this_key) {
                    if (err) {throw err;}
                    if (this_key === null) {
                        resolve(false);
                    } else {
                        dbo.collection(config.mongo.players_collection).find({registration_key: registration_key, active: true}).toArray(function(err, all_players) {
                            if (err) {throw err;}
                            db.close();

                            if (this_key.limit == 0) {
                                resolve(true);
                            } else {
                                resolve(all_players.length < this_key.limit);
                            }
                        });
                    }
                });
            });
        });
    },

    /**
     * Register a new player -- does not check registration key
     * @param {string} player_name 
     * @param {string} registration_key 
     * @returns {Player}
     */
     register_player: async function(new_player_object) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.players_collection).insertOne(new_player_object, function(err, mongo_result) {
                    if (err) {throw err;}
                    db.close();
                    resolve(new_player_object);
                });
            });
        });
    },

    /**
     * Deactivate a player
     * @param {number} player_id 
     * @returns {Player}
     */
    deactivate: async function(player_id) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.players_collection).findOne({player_id: player_id})
                .then(function (this_player) {
                    this_player.active = false;
                    dbo.collection(config.mongo.players_collection).replaceOne({player_id: player_id}, this_player)
                    .then(function () {
                        db.close();
                        resolve(this_player);
                    });
                });
            });
        });
    },

    /**
     * Reactivate a player if their registratio key allows it
     * @param {number} player_id 
     * @returns {Player}
     */
     reactivate: async function(player_id) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.players_collection).findOne({player_id: player_id})
                .then(function (this_player) {
                    players_database.check_registration_key(this_player.registration_key)
                    .then(function (is_allowed) {
                        if (is_allowed) {
                            this_player.active = true;
                            dbo.collection(config.mongo.players_collection).replaceOne({player_id: player_id}, this_player)
                            .then(function () {
                                db.close();
                                resolve(this_player);
                            });
                        } else {
                            resolve(this_player);
                        }
                    });
                });
            });
        });
    },

    /**
     * Check if a player is allowed to start a new game
     * @param {number} player_id 
     * @returns {boolean}
     */
     check_new_game: async function(player_id) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}

                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.players_collection).findOne({player_id: player_id})
                .then(function (this_player) {
                    if (err) {throw err;}
                    if (this_player === null) { // player does not exist
                        db.close();
                        resolve(false);

                    } else if (this_player.active) { // player is active
                        // checking to active game limits
                        dbo.collection(config.mongo.active_games_collection).find({player_id: player_id}).toArray(function(err, all_games) {
                            if (err) {throw err;}
                            db.close();
                            resolve(all_games.length < config.limits.active_games);
                        });

                    } else { // player_id not real or inavtive
                        db.close();
                        resolve(false);
                    }
                });
            });
        });
     },

    /**
     * Checks if a player_name already exists
     * @param {string} player_name 
     * @returns {boolean}
     */
     duplicate_name: async function (player_name) {
        return new Promise((resolve) => {
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.players_collection).findOne({player_name: player_name})
                .then(function (this_player) {
                    if (this_player == null) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        });
    },
}