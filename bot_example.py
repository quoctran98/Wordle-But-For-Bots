import csv
from urllib.parse import urlencode
import urllib.request
import json

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

def score_words (solutions_remaining):
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

    best_scores = sorted(((value, index) for index, value in enumerate(guess_scores["score"])), reverse = True)
    return(guess_scores["guess"][best_scores[1][1]])

def GET_constructor (url, path, params):
    return(url + path + urlencode(params))

#valid_guesses = open("valid_guesses.csv", "r").readlines()
#valid_guesses = [x[0] for x in list(csv.reader(valid_guesses ,delimiter  = ",")) if x[0] != "word"]

#valid_solutions = open("valid_solutions.csv", "r").readlines()
#valid_solutions = [x[0] for x in list(csv.reader(valid_solutions ,delimiter  = ",")) if x[0] != "word"]

letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

solutions_remaining = valid_guesses
solution_letters_in = set()
solution_letters_out = set()
solution_positions = [False, False, False, False, False]

response = urllib.request.urlopen().read().decode('utf-8')
response = json.loads(response) # now it's a python dict

print(response)

for round in range (6):
    feedback = str(prompt("what did wordle say? "))
    feedback = [char for char in feedback]
    split_guess = [char for char in what_to_guess]

    for pos in range(5):
        if (feedback[pos] == "0"):
            solution_letters_out.add(split_guess[pos])
        elif (feedback[pos] == "1"):
            solution_letters_in.add(split_guess[pos])
        elif (feedback[pos] == "2"):
            solution_letters_in.add(split_guess[pos])
            solution_positions[pos] = split_guess[pos]
        else: 
            print("bad")
    
    # solve the weird double letter thing
    solution_letters_out = solution_letters_out.difference(solution_letters_in)

    solutions_remaining = filter_words(solutions_remaining, solution_letters_in, solution_letters_out, solution_positions)
    print(solutions_remaining)
    what_to_guess = score_words(solutions_remaining)
    print("guess: " + what_to_guess)
