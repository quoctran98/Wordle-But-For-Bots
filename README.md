# About

This is [Wordle](https://www.powerlanguage.co.uk/wordle/) but built for bots to compete against each other.

# How To Play

If a server is already set up, these are instructions on how to play. All actions are performed through an HTTP GET request to the server at `http://[HOST]:[PORT]` with the syntax `http://[HOST]:[PORT]/[PATH]?[QUERY]`

### Registering a new player (or bot)

In the code everything refers to a "player" but I envision these to be bots. Each person (not player!) will be given a `registration_key` which can register a certain number of "players" or bots. The documentation and code will refer to these as players going forward.

Registration of a new player requires an GET request to the path `/api/register` with a `player_name`, which can be any string, and `registration_key` filled out in the `?query` component. The server will respond with with a JSON object of the player's data.

The `scores` and `score_times` arrays will be filled with the scores and the Unix timestamps, respectively, of games as they are played.

Here is an example request to register a player with the `player_name=quoc-bot` and `registration_key=1234`:

REQUEST: 

```
http://[HOST]:[PORT]/api/register?player_name=quoc-bot&registration_key=1234
```

RESPONSE: 

```
{
    "time_registered":1643677248826,
    "player_id":-1319687248,
    "registration_key":1234,
    "player_name":"quoc-bot",
    "scores":[],
    "score_times":[],
    "active":true
}
```

### Starting a new Wordle game

To start a new game make GET request to the path `/api/start` with your `player_id`. The server will respond with the game's JSON object. 

The `game_token` will be used to make future guesses. The `guesses`, `feedback`, and `guess_times` arrays will be filled with the guesses made, the Wordle feedback, and the Unix timestamps, respectively, of guesses as they are made. The `won` or `forfeit` status will be set to `true` when the game has either been won or forfeited.

Here is an example request for the previously registered player to start a new game with `player_id=-1319687248`:

REQUEST: 

```
http://[HOST]:[PORT]/api/start?player_id=-1319687248
```

RESPONSE: 

```
{
    "time_started":1643677266357,
    "player_id":-1319687248",
    "game_token":812232609",
    "guesses":[],
    "feedback":[],
    "guess_times":[],
    "won":false,
    "forfeit":false
}
```

### Making a guess

A guess for a particular game is made as a GET request to the path `/api/guess` with the `game_token` and `guess`. The server will respond with a JSON object of the game's current state including an array in `feedback` with the Wordle feedback of the guess. 

The list of valid solutions are in `/server/valid_solutions.csv` and the list of valid words to guess are in `/server/valid_guesses.csv`. Keep in mind that the two lists of words do not intersect. You are allowed to guess words from both lists but only words in the valid solutions list will be solutions. Don't try to guess a word that's not in either list -- I don't know how the API will respond.

In this array, a `2` corresponds to a green square or the letter being in the word and in the right position, a `1` corresponds to a yellow square or the letter being in the word but in the wrong spot, and a `0` corresponds to a gray square or the letter not being in the word at all (for words with double letters, I implemented the same feedback rules as the original Wordle game according to [this website](https://nerdschalk.com/wordle-same-letter-twice-rules-explained-how-does-it-work/)).

Here is an example request to guess the word "grace" on the previously created game with `game_token=812232609` and `guess=grace` :

REQUEST: 

```
http://[HOST]:[PORT]/api/guess?game_token=812232609&guess=grace
```

RESPONSE: 

```
{
    "time_started":1643677266357,
    "player_id":-1319687248",
    "game_token":812232609",
    "guesses":["grace"],
    "feedback":[
        [2,1,0,0,0]
    ],
    "guess_times":[1643677269940],
    "won":false,
    "forfeit":false
}
```

If the game has been won, the server will respond with the game object, with the last guess accounted for in the `guesses`, `feedback`, and `guess_times` arrays. The solution will be revealed in the `word` attribute and the `won` attribute will be set to `true`. The game's score will be saved and the game will no longer be accessible.

REQUEST: 

```
http://[HOST]:[PORT]/api/guess?game_token=812232609&guess=gourd
```

RESPONSE: 

```
{
    "word":"gourd",
    "time_started":1643677266357,
    "player_id":-1319687248",
    "game_token":812232609",
    "guesses":["grace", "gourd"],
    "feedback":[
        [2,1,0,0,0],
        [2,2,2,2,2]
    ],
    "guess_times":[1643677269940, 1643677270917],
    "won":true,
    "forfeit":false
}
```
### Other useful API calls

`/api/find_all_archived_games` takes the argument `player_id` and will return an array game objects for archived games for that player

`/api/find_all_active_games` takes the argument `player_id` and will return an array of game objects for active games for that player

`/api/find_active_game` takes the argument `game_token` and returns the game object of the corresponding game without modifying it

`/api/deactivate` takes the argument `player_id` and will set that player's active status to `false` and returns the player object

`/api/reactivate` takes the argument `player_id` and will set that player's active status to `true` if the registration key's limit has not been reached but returns the player object in either case

### Error handling

If you do something that the server does not like, it will return an error object with an error message and your original request.

REQUEST: 

```
http://[HOST]:[PORT]/api/guess?game_token=812232609&guess=alsdsfldf
```

RESPONSE:

```
{
    "error":true,
    "code":4,
    "message":"Invalid guess: word is not in either valid_guesses.csv or valid_solutions.csv",
    "request_path":"/api/guess",
    "request_query":{
        "guess":"alsdsfldf",
        "game_token":"812232609"
    }
}
```