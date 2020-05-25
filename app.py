import os
from flask import Flask, request, render_template, jsonify, flash, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.secret_key = os.urandom(32)

database_name = "climbing"
database_path = "postgres://{}:{}@{}/{}".format('postgres', 'emerald', 'localhost:5432', database_name)
app.config["SQLALCHEMY_DATABASE_URI"] = database_path

db = SQLAlchemy(app)

migrate = Migrate(app, db)

class ClimbingSpot(db.Model):
    __tablename__ = 'climbingspot'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    location = db.Column(db.String)
    visited_spot = db.relationship('VisitedSpot', backref='climbingspot', lazy=True)
    
class Climber(db.Model):
    __tablename__ = 'climber'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    state = db.Column(db.String)
    visited_spot = db.relationship('VisitedSpot', backref='climber', lazy=True)
    
class VisitedSpot(db.Model):
    __tablename__ = 'visitedspot'
    id = db.Column(db.Integer, primary_key=True)
    climbing_spot_id = db.Column(db.Integer, db.ForeignKey('climbingspot.id'), nullable=True)
    climber_id = db.Column(db.Integer, db.ForeignKey('climber.id'), nullable=True)

db.create_all()

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/climbing-spots', methods=['GET'])
@app.route('/api/climbing-spots', methods=['GET'])
def climbing_spots():
    spot =[]
    for climbingspot in ClimbingSpot.query.all():
        spot.append({
            "id" : climbingspot.id,
            "name" : climbingspot.name,
            "location" : climbingspot.location
        })
    spots = {
        "spot" : spot
    }
    if request.path == '/api/climbing-spots':
        return jsonify({
            'success': True,
            'spots': spots
        })
    return render_template('climbing-spots.html', spots=spots)

@app.route('/climbing-spots', methods=['POST'])
@app.route('/api/climbing-spots', methods=['POST'])
def add_climbing_spots():
    error = False
    try:
        name = request.json['name']
        location = request.json['location']

        climbing_spot = ClimbingSpot(name=name, location=location)
        db.session.add(climbing_spot)
        db.session.commit()
        
        spot =[]
        for climbingspot in ClimbingSpot.query.all():
            spot.append({
                "id" : climbingspot.id,
                "name" : climbingspot.name,
                "location" : climbingspot.location
            })
        spots = {
            "spot" : spot
        }
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
#        flash('An error occurred. Climbing spot ' + request.json['name'] + ' could not be added.')
        abort(400)
    else:
#        flash('Climbing spot ' + request.json['name'] + ' was successfully added!')
        if request.path == '/api/climbing-spots':
            return jsonify({
                'success': True,
                'spots': spots
            })
        return render_template('climbing-spots.html', spots=spots)
    
    
@app.route('/climbers', methods=['GET'])
@app.route('/api/climbers', methods=['GET'])
def climbers():
    climber = []
    for climb in Climber.query.all():
        visitedspot = []
        for visited in VisitedSpot.query.filter_by(climber_id=climb.id).all():
            climbingspot = ClimbingSpot.query.filter_by(id=visited.climbing_spot_id).one_or_none()
            visitedspot.append(climbingspot.name)
        climber.append({
            "id" : climb.id,
            "name" : climb.name,
            "state" : climb.state,
            "visited_spots" : visitedspot
        })
    climbers = {
        "climber" : climber
    }
    if request.path == '/api/climbers':
        return jsonify({
            'success': True,
            'climbers': climbers
        })
    return render_template('climbers.html', climbers=climbers)

@app.route('/climbers', methods=['POST'])
@app.route('/api/climbers', methods=['POST'])
def add_climbers():
    error = False
    try:
        name = request.json['name']
        state = request.json['state']
        visited_spots = request.json['visited_spots']

        climber = Climber(name=name, state=state)
        db.session.add(climber)
        db.session.flush()
        for spot_id in visited_spots:
            visitedspots = VisitedSpot(climbing_spot_id=spot_id, climber_id=climber.id)
            db.session.add(visitedspots)
        db.session.commit()
        
        climber = []
        for climb in Climber.query.all():
            visitedspot = []
            for visited in VisitedSpot.query.filter_by(climber_id=climb.id).all():
                climbingspot = ClimbingSpot.query.filter_by(id=visited.climbing_spot_id).one_or_none()
                visitedspot.append(climbingspot.name)
            climber.append({
                "id" : climb.id,
                "name" : climb.name,
                "state" : climb.state,
                "visited_spots" : visitedspot
            })
        climbers = {
            "climber" : climber
        }
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
#        flash('An error occurred. Climbing spot ' + request.json['name'] + ' could not be added.')
        abort(400)
    else:
#        flash('Climbing spot ' + request.json['name'] + ' was successfully added!')
        if request.path == '/api/climbers':
            return jsonify({
                'success': True,
                'climbers': climbers
            })
        return render_template('climbers.html', climbers=climbers)

@app.route('/climbers/<int:climber_id>', methods=['DELETE'])
@app.route('/api/climbers/<int:climber_id>', methods=['DELETE'])
def remove_climbers(climber_id):
    error = False
    try:
        climber = Climber.query.get(climber_id)
        name = climber.name
        db.session.delete(climber)
        db.session.commit()
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
#        flash('An error occurred. Climbing spot ' + request.json['name'] + ' could not be added.')
        abort(400)
    else:
#        flash('Climbing spot ' + request.json['name'] + ' was successfully added!')
        if request.path == '/api/climbers/' + str(climber_id):
            return jsonify({
                'success': True,
                'id': climber_id,
                'name' : name
            })
        return render_template('climbers.html', climbers=climbers)    
    
#if __name__ == '__main__': 
#    app.run(host='127.0.0.1', port=81, debug=True)
    
if __name__ == '__main__':
    app.run(debug=True)