import csv
from urllib.parse import urlencode
import urllib.request
import json
import time

def filter_words (solutions_remaining, solution_letters_in, solution_letters_out, solution_positions):
    good_words = []
    for word in solutions_remaining:
        let = set([char for char in word])
        if (solution_letters_in.issubset(let) and not solution_letters_out.intersection(let)):
            still_good = True
            for pos in range(5):
                if (solution_positions[pos] != False and solution_positions[pos] != [char for char in word][pos]):
                    still_good = False
                    break
            if (still_good):
                good_words.append(word)
    return(good_words)

def guess_word (solutions_remaining):
    guess_matrix = []
    guess_matrix = [[ 0 for i in range(26)] for j in range(5)]

    for word in [x for x in solutions_remaining]:
        let = [char for char in word]
        for i in range(5):
            guess_matrix[i][letters.index(let[i])] += 1
        
    guess_scores = {
            "guess": [],
            "score": []
    }

    for guess in [x for x in solutions_remaining]:
        guess_scores["guess"].append(guess)
        score = 0
        let = [char for char in guess]
        for pos in range(5):
            score += guess_matrix[pos][letters.index(let[pos])]
        guess_scores["score"].append(score)

    # sometimes it breaks here and i don't know why...
    # my best guess is that sometimes guess_scores is empty?
    if (len(guess_scores["guess"]) == 1):
        return(guess_scores["guess"][0])
    else:
        best_scores = sorted(((value, index) for index, value in enumerate(guess_scores["score"])), reverse = True)
        return(guess_scores["guess"][best_scores[1][1]])

def play_game (server_url, player_id):
    remaining_words = valid_solutions #+ valid_guesses
    solution_letters_in = set()
    solution_letters_out = set()
    solution_positions = [False, False, False, False, False]

    # starting the game
    new_game = urllib.request.urlopen(server_url + "/api/start?player_id=" + str(player_id)).read().decode('utf-8')
    new_game = json.loads(new_game) # now it's a python dict
    game_token = new_game["game_token"]
    won_game = new_game["won"]

    this_guess = guess_word(remaining_words) # first guess

    while not won_game:
        url_string = server_url + "/api/guess?game_token=" + str(game_token) + "&guess=" + this_guess
        this_round = urllib.request.urlopen(url_string).read().decode('utf-8')
        this_round = json.loads(this_round) # now it's a python dict

        print(this_guess)

        won_game = this_round["won"]
        if (won_game):
            print("won in " + str(len(this_round["guesses"])))
            break
        else:
            remaining_words.remove(this_guess) # really should have taught of this earlier
            this_feedback = this_round["feedback"][-1]
            this_guess_list = [char for char in this_guess]
            for pos in range(5):
                if (this_feedback[pos] == 0):
                    solution_letters_out.add(this_guess_list[pos])
                elif (this_feedback[pos] == 1):
                    solution_letters_in.add(this_guess_list[pos])
                elif (this_feedback[pos] == 2):
                    solution_letters_in.add(this_guess_list[pos])
                    solution_positions[pos] = this_guess_list[pos]
                # solve the weird double letter thing
                solution_letters_out = solution_letters_out.difference(solution_letters_in)
            remaining_words = filter_words(remaining_words, solution_letters_in, solution_letters_out, solution_positions)
            this_guess = guess_word(remaining_words)

valid_guesses = open("./bot_examples/valid_guesses.csv", "r").readlines()
valid_guesses = [x[0] for x in list(csv.reader(valid_guesses ,delimiter  = ",")) if x[0] != "word"]

valid_solutions = open("./bot_examples/valid_solutions.csv", "r").readlines()
valid_solutions = [x[0] for x in list(csv.reader(valid_solutions ,delimiter  = ",")) if x[0] != "word"]

letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

server_url = ""
bot_name = ""

# register this bot then play 100 games
url_string = server_url + "/api/register?player_name=" + str(bot_name) + "&registration_key=" + "1234"
new_player = urllib.request.urlopen(url_string).read().decode('utf-8')
new_player = json.loads(new_player) # now it's a python dict
print(new_player)

for i in range(100):
    play_game(server_url, new_player["player_id"])
