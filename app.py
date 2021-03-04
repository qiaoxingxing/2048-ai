from flask import Flask
from flask import request

app = Flask(__name__)
import ai2048 as ai

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/best',methods=['POST'])
def best():
    a  = request
    array = request.get_json()
    best_move = ai.get_best(array)
    return best_move
    