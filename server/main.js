global.fs = require('fs');
global.express = require("express");
global.mongoClient = require('mongodb').MongoClient;

global.functions = require("./functions/functions.js");
global.wordle = require("./functions/wordle.js");
global.games_database = require("./functions/games_database.js");
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
        this.active = false // player is active once they play their first game
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

// Serving the HTML landing page
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/pages/" + "home.html");
});
app.get('/retro_modified.css', function(req, res) {
    res.sendFile(__dirname + "/pages/" + "retro_modified.css");
});


// Serving the HTML leaderboard page
app.get("/leaderboard", function (req, res) {
    res.sendFile(__dirname + "/pages/" + "leaderboard.html");
});
app.get('/leaderboard.js', function(req, res) {
    res.sendFile(__dirname + "/pages/" + "leaderboard.js");
});

// Serving the data the populate the leaderboard page
app.get("/leaderboard_data", function (req, res) {
    score.compile_scores()
    .then(function(leaderboard) {
        res.send(leaderboard);
    });
});

// HTTP GET for registering a player
app.get("/register", function (req, res) {
    const registration_key = req.query.registration_key;
    const player_name = req.query.player_name;

    // TODO CHECK REGISTRATION KEY

    let new_player = new Player(player_name, registration_key);
    mongoClient.connect(config.mongo.url, {useUnifiedTopology: true}, function (err, db) {
        if (err) {throw err;}
        const dbo = db.db(config.mongo.database);
        dbo.collection(config.mongo.players_collection).insertOne(new_player, function(err, mongo_result) {
            if (err) {throw err;}
            db.close();
            console.log(new_player);
            res.send(new_player);
        });
    });
});

// HTTP GET for guessing a word
app.get("/guess", function (req, res) {
    const game_token = Number(req.query.game_token);
    const guess = req.query.guess;
    games_database.find_game(game_token).then(function(this_game) {
        if (this_game.won || this_game.forfeit) { // already won or forfeit
            res.send(false);
        } else {
            // process the game object with guess feedback 
            let wordle_feedback = wordle.process_guess(guess, this_game.word, valid_guesses)
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
            } else { // keep guessing: save, then send back the cleaned game object without the solution
                games_database.save_game(this_game).then(function () {
                    let cleaned_game_object = this_game;
                    delete cleaned_game_object._id;
                    delete cleaned_game_object.word;
                    res.send(cleaned_game_object);
                });
            }
        }
    });
});

// HTTP GET for forfeiting a game
app.get("/forfeit", function (req, res) {
    const game_token = Number(req.query.game_token);
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

// HTTP GET for starting a new game
app.get("/start", function (req, res) {
    const player_id = req.query.player_id;

    // TODO confirm player is allowed to start a new game

    let new_game = new Game(player_id);
    // send back the cleaned new game object without the solution
    games_database.create_game(new_game).then(function() {
        console.log(new_game);
        let cleaned_game_object = new_game;
        delete cleaned_game_object._id;
        delete cleaned_game_object.word;
        res.send(cleaned_game_object);
    });
});

// importing config and word lists
global.config = fs.readFileSync("./config.json");
config = JSON.parse(config);

global.valid_guesses = fs.readFileSync("valid_guesses.csv", "utf8");
valid_guesses = valid_guesses.split(/\r?\n/).slice(1);

global.valid_solutions = fs.readFileSync("valid_solutions.csv", "utf8");
valid_solutions = valid_solutions.split(/\r?\n/);
valid_solutions = valid_solutions.slice(1);

// original valid_guesses list are allowed guesses that aren't solutions
valid_guesses = valid_guesses.concat(valid_solutions);

app.listen(config.server.port);
//app.listen(config.server.port, config.server.host);
