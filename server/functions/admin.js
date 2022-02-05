const functions = require("./functions");

module.exports = {
    /**
     * Generate a new registration key
     * @param {number} limit 
     * @param {string} notes 
     * @returns {string} registration_key
     */
     new_registration_key: async function (limit = 5, notes = "") {
        return new Promise((resolve) => {
            new_key = {
                key: functions.random_string(8),
                limit: limit,
                notes: notes
            }
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.registration_keys_collection).insertOne(new_key, function(err, mongo_result) {
                    if (err) {throw err;}
                    db.close();
                    resolve(new_key);
                });
            });
        });
    },

    /**
     * Get info about a registration key
     * @param {string} registration_key 
     * @returns {Array}
     */
     find_registration_key: async function (registration_key) {
        return new Promise((resolve) => {
            new_key = {
                key: registration_key,
                limit: limit,
                notes: notes
            }
            mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
                if (err) {throw err;}
                const dbo = db.db(config.mongo.database);
                dbo.collection(config.mongo.registration_keys_collection).find({key: registration_key}, function(err, mongo_result) {
                    if (err) {throw err;}
                    db.close();
                    resolve(mongo_result);
                });
            });
        });
    },
}