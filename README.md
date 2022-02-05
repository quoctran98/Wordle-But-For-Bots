# About

This is an API server for people to build bots that [Wordle](https://www.powerlanguage.co.uk/wordle/) to pit those bots against each other. The server hosts a leaderboard of average guesses taken by each bot to solve a Wordle. Each bot competes by making API calls to the server.

# Quick Start Guide

The easiest way to get started is to use the boilerplate Python script in `/bots/boilerplate_script.py`. To play you will need to have access to a server hosing Wordle-But-For-Bots at `[HOST]` and a `registration_key` from that server. The boilerplate Python script makes it easy to write a quick Wordle bot (referred to as a "player" in most of the code) that can interface with the API server.

1. Fill in fill out the variable declarations for `server_url` and `registration_key` with the supplied values.
2. Choose a `bot_name` and assign it to that variable.
3. Create a `game_state` Python dictionary at the start of the `play_game()` function. The `game_state` should reflect the information already known about the word the bot is trying to guess.
4. Write the `update_game_state()` function. It should take your `game_state` and a `feedback` Python list as arguments and output your new `game_state`. `feedback` is the Wordle feedback about the bot's last guess and will be a list of 5 numbers. Each index corresponds to the position of a letter in the word previously gussed. A `2` is a green square. A `1` is a yellow` square. A `0` is a gray square.
5. Write the `guess_word()` function that takes the current `game_state` Python dictionary as an input and returns a word from either the `valid_guesses` or `valid_solutions` lists
6. Run the script. It should register the bot and play 100 games with the server. The script will pause execution and print an error message if it encounters any.

# API Documentation

All actions are performed through an HTTP GET request to the server at `http://[HOST]` with the syntax `http://[HOST]/[PATH]?[QUERY_PARAM_1]=[QUERY_VALUE_1]&[QUERY_PARAM_2]=[QUERY_VALUE_2]`

### Registering a new player (or bot)

**GET Request Path:** `/api/register`

**Query Parametrs:**

`registration_key`: an alphanumeric string supplied by the server

`player_name`: any unique string to name the bot (also referred to as a player)

**"Player Object" JSON Response Attributes:**

`time_registered`: Unix timestamp of when the registration was processed

`player_id`: a (secret) number used to start games and perform other operations

`registration_key`: the key used to register this player

`player_name`: the name assigned to this player

`scores`: an array to be filled with scores of finished games

`score_times`: an array to be filled with the Unix timestamps of finished games

`active`: a boolean value -- all players are active by default. Each `registration_key` can have a certain number of `active` bots. These bots can be deactivated to register more bots and reactivated at a later date.

**Errors:**

`2`: Insufficient parameters supplied in API request

`3`: Invalid registration: registration_key does not exist or has too many registered players

`7`: Invalid registration: player_name must be unique


**Request Example: **

```
http://[HOST]/api/register?player_name=quoc-bot&registration_key=1234
```

**Response Example: **

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

**GET Request Path:** `/api/start`

**Query Parametrs:**

`player_id`: the id of the player starting the game

**"Game Object" JSON Response Attributes:**

`time_started`: Unix timestamp of when the game was started

`player_id`: the id of the player who started this game

`game_token`: the unique token used to continue playing this game. This token is a hash ([specifically this one](http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)) of the concatenation of the solution word, `player_id`, and `time_started`.

`guesses`: an array of valid guesses made

`feedback`: an array of feedback on guesses made. Each position in the array corresponds to a letter in the word guessed. A `2` is a green square: the letter is in the word in that postion. A `1` is a yellow square: the letter is in the word but not in that position. A `0` is a gray square: the letter is not in the word at all. Double letter rules should be implemented the same as Wordle's, according to [this website](https://nerdschalk.com/wordle-same-letter-twice-rules-explained-how-does-it-work/).

`guess_times`: an array of Unix timestamps of when each guess was processed

`won`: boolean -- won games are scored archived and can no longer be played

`forfeit`: boolean -- forfeiting games is not yet implemented

**Errors:**

`2`: Insufficient parameters supplied in API request

`5`: Cannot start a new game: player_id does not exist, is not active, or has too many active games

**Request Example: **

```
http://[HOST]/api/start?player_id=-1319687248
```

**Response Example: **

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

**GET Request Path:** `/api/guess`

**Query Parametrs:**

`game_token`: the token of the game being played

`guess`: the word being guessed. The list of valid Wordle solutions and guesses, respectively, are in `/server/valid_solutions.csv` and `/server/valid_guesses.csv`. Keep in mind that the two lists of words do not intersect. Words from both lists can be gussed.

**"Game Object" JSON Response Attributes:**

`time_started`: Unix timestamp of when the game was started

`player_id`: the id of the player who started this game

`game_token`: the unique token used to continue playing this game

`guesses`: an array of valid guesses made

`feedback`: an array of feedback on guesses made

`guess_times`: an array of Unix timestamps of when each guess was processed

`won`: boolean -- won games are scored archived and can no longer be played

`forfeit`: boolean -- forfeiting games is not yet implemented

**NOTE: there is no six guess limit -- the bot should guess until it has won**

**Errors:**

`2`: Insufficient parameters supplied in API request

`4`: Invalid guess: word is not in either valid_guesses.csv or valid_solutions.csv

`5`: Invalid guess: game_token does not match an active game

**Request Example (first guess): **

```
http://[HOST]/api/guess?game_token=812232609&guess=grace
```

**Response Example (first guess): **

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


**Request Example (won game): **

```
http://[HOST]/api/guess?game_token=812232609&guess=gourd
```

**Response Example (won game): **

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

`/api/find_all_archived_games` takes the argument `player_id` and will return an array archived (won or forfeited) Game Objects for that player

`/api/find_all_active_games` takes the argument `player_id` and will return an array of Game Objects for active games for that player

`/api/find_active_game` takes the argument `game_token` and returns the Game Object of the corresponding game without modifying it

`/api/deactivate` takes the argument `player_id` and will set that player's active status to `false` and returns the Player Object

`/api/reactivate` takes the argument `player_id` and will set that player's active status to `true` if the registration key's limit has not been reached and returns the Player Object if successful

### Error handling

If you do something that the server does not like, it will return an Error Object with an error message and your original request.

**Error Object JSON Response Attributes:**

`error`: boolean -- this attribute will only appear on error messages

`code`: the error code

`message`: message describing the error

`request_path`:  path of the original API request

`request_query`: JSON object of the query parameters of the original API request

**Request Example (invalid guess): **

```
http://[HOST]/api/guess?game_token=812232609&guess=alsdsfldf
```

**Response Example (invalid guess):**

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
