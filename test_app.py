import os
import unittest
import json
from flask_sqlalchemy import SQLAlchemy

from app import app
from models import setup_db, db_create_all, return_db, ClimbingSpot, Climber, VisitedSpot, db as models_db

jwt_token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkRTQ1RsRlo4alQyR3d1OXJuRHVQTCJ9.eyJpc3MiOiJodHRwczovL2NsaW1iaW5nLXNwb3QuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDVlZDljYmZlNTZkMDYyMDAxMzJlNDUzZiIsImF1ZCI6ImNsaW1iaW5nIiwiaWF0IjoxNTkxNDc0NDc1LCJleHAiOjE1OTE0ODE2NzUsImF6cCI6Ik5BbDdWNFlPOW9ydDEyN3VWVjhPUzNxMW5tSlBaN29yIiwic2NvcGUiOiIiLCJwZXJtaXNzaW9ucyI6WyJkZWxldGU6Y2xpbWJlciIsImRlbGV0ZTpjbGltYmluZy1zcG90IiwicGF0Y2g6Y2xpbWJlciIsInBhdGNoOmNsaW1iaW5nLXNwb3QiLCJwb3N0OmNsaW1iZXIiLCJwb3N0OmNsaW1iaW5nLXNwb3QiXX0.DLa8DgWHlw3Bu7pjp4DHWEnwLocjjttbTd_OeqaHVqscIl64GPxOC6ZXI2gZorRqokThtTh9nWipUHlqElPw6ggj3Sh0Yj7VIteS-4g5-XqKZ7BdAMsJ_IJaSv71ZD7XdjMNESezMv-KoTNxE4Aqenc3vA4a5nnutnf5kaMeV2nJJ1xbRN0ZO2xkUzfkMnFK-QSWrjffmHBUkCht2aGLMBI5-RahqFyxgaP_hks-kycNf7hDjsLL3hYE2PxVyCO3_X3NKBQiAW_fJy4XFXOmEtbTNTMkL69rcVye-ZPNVceD2ApBTUaAl-jq2R5jdNXBAnCWn_Y2-TivAIujB5YslQ'

class ClimbingTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client
#        self.database_name = "climbing_test"
#        self.database_path = "postgres://{}:{}@{}/{}".format('postgres', 'emerald', 'localhost:5432', self.database_name)
        self.database_path = "postgres://{}:{}@{}/{}".format('kotcnkvlfxfpqd', 'f567da0d15538f491aa4cde4551069a3b7d132533b467eaf8beeef190298d500', 'ec2-184-72-235-159.compute-1.amazonaws.com:5432', 'demuer9gsfup1p')
        self.app.config["SQLALCHEMY_DATABASE_URI"] = self.database_path
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        self.app.config['LOGIN_DISABLED'] = True
        models_db.app = self.app
        models_db.init_app(self.app)
#        models_db.drop_all()
        models_db.create_all()
        
#        with self.app.app_context():
#            db = SQLAlchemy()
#            db.init_app(self.app)
#            db.create_all()
    
    def tearDown(self):
        pass
        
    #=================Add climbing spot=================
        
    def test1_add_climbing_spot(self):
        res = self.client().post('/api/climbing-spots', json={'id': 1, 'name': 'Powerlinez', 'location': 'Ramapo, NY'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(len(data['spots']))
        
    def test1_add_climbing_spot_with_incomplete_json(self):
        res = self.client().post('/api/climbing-spots', json={'name': 'Powerlinez'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(data['success'], False)
        
    def test1_add_climbing_spot_without_token(self):
        res = self.client().post('/api/climbing-spots', json={'name': 'Powerlinez', 'location': 'Ramapo, NY'})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
    #=================Get climbing spot endpoints=================
    
    def test2_get_climbing_spots(self):
        res = self.client().get('/api/climbing-spots')
        data = json.loads(res.data)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(len(data['spots']))
        
    #=================Edit climbing spot=================
    
    def test3_edit_climbing_spot(self):
        res = self.client().patch('api/climbing-spots/1', json={'name': 'Powerlinez', 'location': 'Ramapo, NY'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(data['id'])
        
    def test3_edit_climbing_spot_with_incomplete_json(self):
        res = self.client().patch('api/climbing-spots/1', json={'name': 'Powerlinez'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(data['success'], False)
        
    def test3_edit_climbing_spot_without_token(self):
        res = self.client().patch('api/climbing-spots/1', json={'name': 'Powerlinez', 'location': 'Ramapo, NY'})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
    #=================Delete climbing spot=================
    
    def test4_delete_climbing_spot(self):
        res = self.client().delete('api/climbing-spots/1', headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(data['id'])
        
    def test4_delete_climbing_spot_with_invalid_id(self):
        res = self.client().delete('api/climbing-spots/100', headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(data['success'], False)
        
    def test4_delete_climbing_spot_without_token(self):
        res = self.client().delete('api/climbing-spots/1')
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
    #=================Add climber=================
        
    def test1_add_climber(self):
        res = self.client().post('/api/climbers', json={'id': 1, 'name': 'Joshua', 'state': 'New York', 'visited_spots': []}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(len(data['climbers']))
        
    def test1_add_climber_with_incomplete_json(self):
        res = self.client().post('/api/climbers', json={'name': 'Joshua'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(data['success'], False)
        
    def test1_add_climber_without_token(self):
        res = self.client().post('/api/climbers', json={'name': 'Joshua', 'state': 'New York', 'visited_spots': []})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
    #=================Get climber endpoints=================
    
    def test2_get_climbers(self):
        res = self.client().get('/api/climbers')
        data = json.loads(res.data)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(len(data['climbers']))
        
    #=================Edit climber=================
    
    def test3_edit_climber(self):
        res = self.client().patch('api/climbers/1', json={'name': 'Joshua', 'state': 'New York', 'visited_spots': []}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(data['id'])
        
    def test3_edit_climber_with_incomplete_json(self):
        res = self.client().patch('api/climbers/1', json={'name': 'Joshua'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(data['success'], False)
        
    def test3_edit_climber_without_token(self):
        res = self.client().patch('api/climbers/1', json={'name': 'Joshua', 'state': 'New York', 'visited_spots': []})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
    #=================Delete climber=================
        
    def test4_delete_climber(self):
        res = self.client().delete('api/climbers/1', headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(data['id'])
        
    def test4_delete_climber_with_invalid_id(self):
        res = self.client().delete('api/climbers/100', headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 400)
        self.assertEqual(data['success'], False)
        
    def test4_delete_climber_without_token(self):
        res = self.client().delete('api/climbers/1')
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
if __name__ == "__main__":
    unittest.main()