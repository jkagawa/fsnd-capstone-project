import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

db = SQLAlchemy()

load_dotenv()

database_name = os.environ.get('DATABASE_NAME')
database_user = os.environ.get('DATABASE_USER')
database_password = os.environ.get('DATABASE_PASSWORD')
database_url = os.environ.get('DATABASE_URL')
database_path = "postgresql://{}:{}@{}/{}".format(database_user, database_password, database_url, database_name)

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
