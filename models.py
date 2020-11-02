import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()

#database_name = os.environ['database_name']
#database_name = "climbing"
#database_path = "postgres://{}:{}@{}/{}".format('postgres', 'emerald', 'localhost:5432', database_name)
#database_path = os.environ['DATABASE_URL']
database_name = "d8b3a9n3e5jv3p"
database_path = "postgres://{}:{}@{}/{}".format('esvqiibikborvn', '9f493fabfcbd0dbdd41ffd093121def61262c48b3622f1a9dd0889cc5e3270ba', 'ec2-18-214-211-47.compute-1.amazonaws.com:5432', database_name)

def setup_db(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = database_path
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.app = app
    db.init_app(app)
    migrate = Migrate(app, db)

def return_db():
    return db
    
def db_create_all():
    db.create_all()

class ClimbingSpot(db.Model):
    __tablename__ = 'climbingspot'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    location = db.Column(db.String)
    address_street = db.Column(db.String)
    address_city = db.Column(db.String)
    address_state = db.Column(db.String)
    address_zipcode = db.Column(db.String)
    indoor_or_outdoor = db.Column(db.Integer)
    outdoor_coordinates = db.Column(db.String)
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