from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
#app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://postgres:emerald@localhost:5432/todoapp'
#db = SQLAlchemy(app)
#
#migrate = Migrate(app, db)

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/climbing-spots', methods=['GET'])
def climbing_spots():
    spots = {
        "spot" :
        [{
            "name" : "Powerlinez",
            "location" : "Ramapo, NY"
        },
        {
            "name" : "Ice Pond",
            "location" : "Brewster, NY"
        },
        {
            "name" : "Gunks",
            "location" : "New Paltz, NY"
        }
    ]}
    return render_template('climbing-spots.html', spots=spots)

@app.route('/climbers', methods=['GET'])
def climbers():
    climbers = {
        "climber" :
        [{
            "name" : "Joshua",
            "state" : "New York",
            "visited_spots" : [
                "Powerlinez",
                "Ice Pond",
                "Gunks",
                "Gunks",
                "Gunks",
                "Gunks",
                "Gunks",
                "Gunks",
                "Gunks"
            ]
        },
        {
            "name" : "Pat",
            "state" : "New York",
            "visited_spots" : [
                "Powerlinez",
                "Gunks"
            ]
        },
        {
            "name" : "Greg",
            "state" : "New York",
            "visited_spots" : [
                "Powerlinez"
            ]
        }
    ]}
    return render_template('climbers.html', climbers=climbers)

#if __name__ == '__main__': 
#    app.run(host='127.0.0.1', port=81, debug=True)
    
if __name__ == '__main__':
    app.run(debug=True)