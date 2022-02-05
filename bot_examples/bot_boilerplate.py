import csv
import json
import urllib.request

server_url = ""
bot_name = ""
registration_key = ""

def update_game_state (game_state, feedback):
    # write a function here
    return(game_state)

def guess_word (game_state):
    # write a function here
    return("gourd")

def play_game (server_url, player_id):
    game_state = {
    # some game state object
    }

    # sending the API request to start a new game
    new_game = urllib.request.urlopen(server_url + "/api/start?player_id=" + str(player_id)).read().decode('utf-8')
    new_game = json.loads(new_game) # now it's a python dict

    if ("error" in new_game):
            print(new_game)
            return

    game_token = new_game["game_token"]
    this_guess = guess_word(game_state) # first guess
    won_game = False

    while not won_game:
        print(this_guess)

        # sending the API request to guess a word
        url_string = server_url + "/api/guess?game_token=" + str(game_token) + "&guess=" + this_guess
        this_round = urllib.request.urlopen(url_string).read().decode('utf-8')
        this_round = json.loads(this_round) # now the game object is a python dict

        if ("error" in this_round):
            print(this_round)
            return
        
        if (this_round["won"]): # the game is won: exit loop
            print("won in " + str(len(this_round["guesses"])))
            won_game = True
            return            
        else: # prepare guess for next loop
            game_state = update_game_state(game_state, this_round["feedback"])
            this_guess = guess_word(game_state)

# importing word lists and letters
valid_guesses = open("./bot_examples/valid_guesses.csv", "r").readlines()
valid_guesses = [x[0] for x in list(csv.reader(valid_guesses ,delimiter  = ",")) if x[0] != "word"]
valid_solutions = open("./bot_examples/valid_solutions.csv", "r").readlines()
valid_solutions = [x[0] for x in list(csv.reader(valid_solutions ,delimiter  = ",")) if x[0] != "word"]
letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

# register this bot then play 100 games
url_string = server_url + "/api/register?player_name=" + str(bot_name) + "&registration_key=" + registration_key
new_player = urllib.request.urlopen(url_string).read().decode('utf-8')
new_player = json.loads(new_player) # now it's a python dict
print(new_player)

for i in range(100):
    play_game(server_url, new_player["player_id"])
