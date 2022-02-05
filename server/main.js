const players_database = require('./functions/players_database.js');

global.fs = require('fs');
global.path = require('path');
global.express = require("express");
global.mongoClient = require('mongodb').MongoClient;

global.admin = require("./functions/admin.js");
global.functions = require("./functions/functions.js");
global.wordle = require("./functions/wordle.js");
global.games_database = require("./functions/games_database.js");
global.players_database = require("./functions/players_database.js");
global.score = require("./functions/score.js");

global.app = express();

class Player {
    constructor(player_name, registration_key) {
        this.time_registered = Date.now(),
        this.player_id = functions.hash_string(String(this.time_registered) + player_name),
        this.registration_key = registration_key;
        this.player_name = player_name,
        this.scores = [],
        this.score_times = [],
        this.active = true
    }
}

class Game {
    constructor(player_id) {
        this.word = valid_solutions[Math.floor(Math.random() * valid_solutions.length)]
        this.time_started = Date.now(),
        this.player_id = Number(player_id),
        this.game_token = functions.hash_string(this.word + this.player_id + this.time_started),
        this.guesses = [],
        this.feedback = [],
        this.guess_times = [],
        this.won = false,
        this.forfeit = false
    }
}

const error_messages = {
    0: "It's all good :)",
    1: "Something went wrong and I don't know what",
    2: "Insufficient parameters supplied in API request",
    3: "Invalid registration: registration_key does not exist or has too many registered players",
    4: "Invalid guess: word is not in either valid_guesses.csv or valid_solutions.csv",
    5: "Cannot start a new game: player_id does not exist, is not active, or has too many active games",
    6: "Invalid guess: game_token does not match an active game",
    7: "Invalid registration: player_name must be unique",
    8: "player_name does not exist"
}

class Error {
    constructor(error_code, request) {
        this.error = true,
        this.code = error_code,
        this.message = error_messages[error_code],
        this.request_path = request.path,
        this.request_query = request.query
    }
}

// serve the entire pages folder (html and js) as the home page
// i don't know how it knows to server index.html first
app.use('', express.static(path.join(__dirname, 'pages')));

// leaderboard data for html
app.get("/data/leaderboard", function (req, res) {
    score.compile_scores()
    .then(function(leaderboard) {
        res.send(leaderboard);
    });
});

// individual player data for html
app.get("/data/player", function (req, res) {
    const player_name = req.query.player_name;

    mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
        if (err) {throw err;}
        const dbo = db.db(config.mongo.database);
        dbo.collection(config.mongo.players_collection).findOne({player_name: player_name})
        .then(function (this_player) {
            db.close();
            if (this_player == null) {
                res.send(new Error(8, req));
                return
            }

            delete this_player._id;
            delete this_player.player_id;
            delete this_player.registration_key;
            res.send(this_player);
        });
    });

});

// HTTP GET for registering a player
app.get("/api/register", function (req, res) {
    const registration_key = req.query.registration_key;
    const player_name = req.query.player_name;
    if (registration_key == null || player_name == null) {
        res.send(new Error(2, req));
        return;
    }
    
    players_database.duplicate_name(player_name)
    .then((is_duplicate) => {
        if (is_duplicate) {
            res.send(new Error(7, req));
            return;
        }

        players_database.check_registration_key(registration_key)
        .then(function (is_allowed) {
            if (is_allowed) {
                players_database.register_player(new Player(player_name, registration_key))
                .then(new_player => res.send(new_player));
            } else {
                res.send(new Error(3, req));
            } 
    });
    });
});

// HTTP GET for starting a new game
app.get("/api/start", function (req, res) {
    const player_id = Number(req.query.player_id);
    if (player_id == null) {
        res.send(new Error(2, req));
        return;
    }

    // confirm player is allowed to start a new game
    players_database.check_new_game(player_id).then(function (is_allowed) {
        if (!is_allowed) {
            res.send(new Error(5, req));
            return;
        }

        let new_game = new Game(player_id);
        // send back the cleaned new game object without the solution
        games_database.create_game(new_game).then(function() {
            let cleaned_game_object = new_game;
            delete cleaned_game_object._id;
            delete cleaned_game_object.word;
            res.send(cleaned_game_object);
        });
    })
});

// HTTP GET for guessing a word
app.get("/api/guess", function (req, res) {
    const game_token = Number(req.query.game_token);
    const guess = req.query.guess;
    if (game_token == null || guess == null) {
        res.send(new Error(2, req));
        return;
    }

    games_database.find_game(game_token).then(function(this_game) {

        if (this_game === null) { // game cannot be found
            res.send(new Error(6, req));
            return;
        }

        // process the game object with guess feedback 
        let wordle_feedback = wordle.process_guess(guess, this_game.word, valid_guesses);
        if (wordle_feedback.length == 0) { // wordle.process_guess() returns an empty array when guess is invalid
            res.send(new Error(4, req));
            return;
        }
        
        this_game.guesses.push(guess);
        this_game.guess_times.push(Date.now());
        this_game.feedback.push(wordle_feedback);

        // the game is won: archive, then send back the whole game object
        if (functions.array_equals(wordle_feedback, [2,2,2,2,2])) {
            this_game.won = true;
            score.save_score(this_game);
            games_database.archive_game(this_game).then(function() {
                let cleaned_game_object = this_game;
                delete cleaned_game_object._id;
                res.send(cleaned_game_object);
            })

        // keep guessing: save, then send back the cleaned game object without the solution
        } else {
            games_database.save_game(this_game).then(function () {
                let cleaned_game_object = this_game;
                delete cleaned_game_object._id;
                delete cleaned_game_object.word;
                res.send(cleaned_game_object);
            });
        }
    });
});

// HTTP GET for finding archived games of a player
app.get("/api/find_all_archived_games", function (req, res) {
    const player_id = Number(req.query.player_id);
    if (player_id == null) {
        res.send(new Error(2, req));
        return;
    }

    games_database.search_archived_games(player_id)
    .then(function (all_games) {
        res.send(all_games);
    });
});

// HTTP GET for finding active games of a player
app.get("/api/find_all_active_games", function (req, res) {
    const player_id = Number(req.query.player_id);
    if (player_id == null) {
        res.send(new Error(2, req));
        return;
    }

    games_database.search_active_games(player_id)
    .then(function (all_games) {
        all_cleaned_games = [];
        all_games.forEach(function (this_game) { // we have to clean these objects for active games
            delete this_game._id;
            delete this_game.word
            all_cleaned_games.append(this_game)
        });
        res.send(all_cleaned_games);
    });
});

// HTTP GET for getting active game info without making a guess
app.get("/api/find_active_game", function (req, res) {
    const game_token = Number(req.query.game_token);
    if (game_token == null) {
        res.send(new Error(2, req));
        return;
    }

    games_database.find_game(game_token)
    .then(function(this_game) {
        let cleaned_game_object = this_game;
        delete cleaned_game_object._id;
        delete cleaned_game_object.word;
        res.send(cleaned_game_object);
    });
});


// HTTP GET for forfeiting a game
app.get("/api/forfeit", function (req, res) {
    const game_token = Number(req.query.game_token);
    if (game_token == null) {
        res.send(new Error(2, req));
        return;
    }

    games_database.find_game(game_token).then(function(this_game) {
        this_game.forfeit = true;
        this_game.guesses.push(""); // store the time of the forfeit
        this_game.guess_times.push(Date.now());
        this_game.feedback.push([]);

        score.save_score(this_game);
        games_database.archive_game(this_game).then(function() {
            let cleaned_game_object = this_game;
            delete cleaned_game_object._id;
            res.send(cleaned_game_object);
        });
    });
});

// HTTP GET for deactivating a player
app.get("/api/deactivate", function (req, res) {
    const player_id = Number(req.query.player_id);
    if (player_id == null) {
        res.send(new Error(2, req));
        return;
    }

    players_database.deactivate(player_id)
    .then(this_player => res.send(this_player));
});


// HTTP GET for deactivating a player
app.get("/api/reactivate", function (req, res) {
    const player_id = Number(req.query.player_id);
    if (player_id == null) {
        res.send(new Error(2, req));
        return;
    }

    players_database.reactivate(player_id)
    .then(this_player => res.send(this_player));
});

// importing config and word lists
global.config = fs.readFileSync(path.join(__dirname, "config.json"));
config = JSON.parse(config);

global.valid_guesses = fs.readFileSync("valid_guesses.csv", "utf8");
valid_guesses = valid_guesses.split(/\r?\n/).slice(1);

global.valid_solutions = fs.readFileSync("valid_solutions.csv", "utf8");
valid_solutions = valid_solutions.split(/\r?\n/);
valid_solutions = valid_solutions.slice(1);

// original valid_guesses list are allowed guesses that aren't solutions
// the two sets dont intersect
valid_guesses = valid_guesses.concat(valid_solutions);

app.listen(process.env.PORT || 5000);
