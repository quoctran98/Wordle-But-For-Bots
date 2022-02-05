# Read the Quick Start Guide in README.md before starting!

import csv
import json
import urllib.request

server_url = ""
bot_name = ""
registration_key = ""

def update_game_state (game_state, feedback):
    # feedback is an array with a number for each letter/position:
    # 2 is a green square, 1 is a yellow square, 0 is a gray square 
    # write a function here
    return(game_state)

def guess_word (game_state):
    # write a function here
    return("gourd")

# function to start and play one game
def play_game (server_url, player_id):
    game_state = {
        # define some game state object (Python list)
    }

    # sending the API request to start a new game
    new_game = urllib.request.urlopen(server_url + "/api/start?player_id=" + str(player_id)).read().decode('utf-8')
    new_game = json.loads(new_game) # new_game is a Python dictionary

    # if there's an error, print it and exit the function -- returning False will also exit the loop
    if ("error" in new_game):
            print(new_game)
            return(False)

    game_token = new_game["game_token"] # game_token is unique to this game and used to play it
    this_guess = guess_word(game_state) # first guess is made on the default game_state
    won_game = False

    # while loop keeps making guesses until the game is won (there is no 6 guess limit)
    while not won_game:
        print(this_guess)

        # sending the API request to guess a word
        url_string = server_url + "/api/guess?game_token=" + str(game_token) + "&guess=" + this_guess
        this_round = urllib.request.urlopen(url_string).read().decode('utf-8')
        this_round = json.loads(this_round) # the server responses with a game object that is a python dict

        if ("error" in this_round):
            print(this_round)
            return(False)
        
        if (this_round["won"]): # the game is won: exit loop
            print("won in " + str(len(this_round["guesses"])))
            won_game = True
            return            
        else: # prepare guess for next loop
            game_state = update_game_state(game_state, this_round["feedback"])
            this_guess = guess_word(game_state)

    return(True)

# importing word lists and creating a list of letters
# keep in mind that the sets of words in valid_guesses and valid_solutions do not intersect
# you can guess words from either list but only words in valid_solutions will be solutions
valid_guesses = open("./bot_examples/valid_guesses.csv", "r").readlines()
valid_guesses = [x[0] for x in list(csv.reader(valid_guesses ,delimiter  = ",")) if x[0] != "word"]
valid_solutions = open("./bot_examples/valid_solutions.csv", "r").readlines()
valid_solutions = [x[0] for x in list(csv.reader(valid_solutions ,delimiter  = ",")) if x[0] != "word"]
letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

# registering this bot and printing the new_player object
url_string = server_url + "/api/register?player_name=" + str(bot_name) + "&registration_key=" + registration_key
new_player = urllib.request.urlopen(url_string).read().decode('utf-8')
new_player = json.loads(new_player) # now it's a python dict
print(new_player)

# play 100 games of wordle if registration works
if ("error" in new_player):
    print(new_player)
else:
    for i in range(100):
        if (not play_game(server_url, new_player["player_id"])):
            break # stop the loop if the function throws an error