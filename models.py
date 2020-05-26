from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()

database_name = "climbing"
database_path = "postgres://{}:{}@{}/{}".format('postgres', 'emerald', 'localhost:5432', database_name)

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