
from __future__ import print_function
from ortools.sat.python import cp_model
import flask
from flask_cors import CORS
from flask import request, jsonify
import requests

app = flask.Flask(__name__)
CORS(app)

def get_solution(params):

    num_nurses = params['num_nurses']
    num_shifts = params['num_shifts']
    num_days = params['num_days']
    shift_requests = params['shift_requests']

    all_nurses = range(num_nurses)
    all_shifts = range(num_shifts)
    all_days = range(num_days)
    # Creates the model.
    model = cp_model.CpModel()

    # Creates shift variables.
    # shifts[(n, d, s)]: nurse 'n' works shift 's' on day 'd'.
    shifts = {}
    for n in all_nurses:
        for d in all_days:
            for s in all_shifts:
                shifts[(n, d, s)] = model.NewBoolVar('shift_n%id%is%i' % (n, d, s))

    # Each shift is assigned to exactly one nurse in .
    for d in all_days:
        for s in all_shifts:
            model.Add(sum(shifts[(n, d, s)] for n in all_nurses) == 1)

    # Each nurse works at most one shift per day.
    for n in all_nurses:
        for d in all_days:
            model.Add(sum(shifts[(n, d, s)] for s in all_shifts) <= 1)

    # min_shifts_assigned is the largest integer such that every nurse can be
    # assigned at least that number of shifts.
    min_shifts_per_nurse = (num_shifts * num_days) // num_nurses
    max_shifts_per_nurse = min_shifts_per_nurse + 1
    for n in all_nurses:
        num_shifts_worked = sum(
            shifts[(n, d, s)] for d in all_days for s in all_shifts)
        model.Add(min_shifts_per_nurse <= num_shifts_worked)
        model.Add(num_shifts_worked <= max_shifts_per_nurse)

    model.Maximize(sum(shift_requests[n][d][s] * shifts[(n, d, s)] for n in all_nurses
            for d in all_days for s in all_shifts))
    # Creates the solver and solve.
    solver = cp_model.CpSolver()
    solver.Solve(model)

    shifts_solved = []
    for d in all_days:
        print('Day', d)
        for n in all_nurses:
            for s in all_shifts:
                if solver.Value(shifts[(n, d, s)]) == 1:
                    shifts_solved.append({
                        "day": d,
                        "nurse": n,
                        "shift": s
                    })


    result = {
        "stats": {
            "requests_met": solver.ObjectiveValue(),
            "time_in_sec": solver.WallTime()
        },
        "shifts_solved": shifts_solved
    }

    return result

@app.route("/api/solve", methods=["POST"])
def solve():
    params = request.json
    print(params)
    solution = get_solution(params)
    return jsonify(solution)

app.run(host="0.0.0.0", port=5050)


