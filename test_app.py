import os
import unittest
import json
from flask_sqlalchemy import SQLAlchemy

from app import app
from models import setup_db, db_create_all, return_db, ClimbingSpot, Climber, VisitedSpot, db as models_db

jwt_token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkRTQ1RsRlo4alQyR3d1OXJuRHVQTCJ9.eyJpc3MiOiJodHRwczovL2NsaW1iaW5nLXNwb3QuYXV0aDAuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTE2MzkwOTc2MTY5NzkwMzg0MjMzIiwiYXVkIjpbImNsaW1iaW5nIiwiaHR0cHM6Ly9jbGltYmluZy1zcG90LmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE1OTA5ODczMDksImV4cCI6MTU5MDk5NDUwOSwiYXpwIjoiTkFsN1Y0WU85b3J0MTI3dVZWOE9TM3Exbm1KUFo3b3IiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwicGVybWlzc2lvbnMiOlsiZGVsZXRlOmNsaW1iZXIiLCJkZWxldGU6Y2xpbWJpbmctc3BvdCIsInBhdGNoOmNsaW1iZXIiLCJwYXRjaDpjbGltYmluZy1zcG90IiwicG9zdDpjbGltYmVyIiwicG9zdDpjbGltYmluZy1zcG90Il19.W5vLJQIdEK5j3Oo9Fz6Rhmr8XFg1BadGBGPeewWeicpljZS-ZWAJHYluQlFdp9FhOdET3FKpepb4TwMiAfVRWhLxJXG0Yne78XlZAtrlITZHIp7O_S6ZrHLwKqmDwyeylchm9v6U6BXlbukVflOtU4Z1YXEg9PzrjjH8N8J_XfIFeJmBoH9MTLSzIXvpi4qKXEJnay8beJJWqm7oW8FXbzIrbPAEehtIWmsVXgOpmE4lFsENABuEEZA0Wx4X-52cIfzBe90nTjK8QpRZPzAZ_TbQTgneGrfSR66CiPwVu2pPzMm6PQmVqG5XcejtLtQfifNHYKGWiUoYY8oxTWE2IQ'

class ClimbingTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client
        self.database_name = "climbing_test"
        self.database_path = "postgres://{}:{}@{}/{}".format('postgres', 'emerald', 'localhost:5432', self.database_name)
        self.app.config["SQLALCHEMY_DATABASE_URI"] = self.database_path
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        self.app.config['LOGIN_DISABLED'] = True
#        db = SQLAlchemy()
        models_db.app = self.app
        models_db.init_app(self.app)
        models_db.create_all()
        
        

#        with self.app.app_context():
#            db = SQLAlchemy()
#            db.init_app(self.app)
#            db.create_all()
    
    def tearDown(self):
        """Executed after reach test"""
        pass

    def test_get_climbing_spots(self):
        res = self.client().get('/api/climbing-spots')
        data = json.loads(res.data)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(len(data['spots']))
        
    def test_add_climbing_spot(self):
        res = self.client().post('/api/climbing-spots', json={'name': 'Powerlinez', 'location': 'Ramapo, NY'}, headers={'Authorization': 'Bearer ' + jwt_token})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['success'], True)
        self.assertTrue(len(data['spots']))
        
    def test_add_climbing_spot_without_token(self):
        res = self.client().post('/api/climbing-spots', json={'name': 'Powerlinez', 'location': 'Ramapo, NY'})
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 401)
        self.assertEqual(data['success'], False)
        
#    def test_get_questions_with_results(self):
#        res = self.client().get('/questions')
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 200)
#        self.assertEqual(data['success'], True)
#        self.assertTrue(len(data['questions']))
#        self.assertTrue(data['total_questions'])
#        self.assertTrue(data['current_category'])
#        self.assertTrue(len(data['categories']))
#        
#    def test_get_questions_with_invalid_category(self):
#        res = self.client().get('/questions?category=100')
#        data = json.loads(res.data)
#
#        self.assertEqual(res.status_code, 422)
#        self.assertEqual(data['success'], False)
#        self.assertEqual(data['message'], 'unprocessable')
#        
#    def test_delete_question_successfully(self):
#        res = self.client().delete('/questions/2')
#        data = json.loads(res.data)
#
#        self.assertEqual(res.status_code, 200)
#        self.assertEqual(data['success'], True)
#        
#    def test_delete_question_with_invalid_question_id(self):
#        res = self.client().delete('/questions/1000')
#        data = json.loads(res.data)
#
#        self.assertEqual(res.status_code, 400)
#        self.assertEqual(data['success'], False)
#        self.assertEqual(data['message'], 'bad request')
#        
#    def test_create_questions_successfully(self):
#        res = self.client().post('/questions', json={'question': 'What is the chemical symbol of water?', 'answer': 'H2O', 'difficulty': '1', 'category': '1'})
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 200)
#        self.assertEqual(data['success'], True)
#    
#    def test_search_successfully(self):
#        res = self.client().post('/questions', json={'searchTerm': 'the'})
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 200)
#        self.assertEqual(data['success'], True)
#        self.assertTrue(len(data['questions']))
#        self.assertTrue(data['total_questions'])
#        
#    def test_search_invalid_category(self):
#        res = self.client().post('/questions', json={'category_id': 100})
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 422)
#        self.assertEqual(data['success'], False)
#        self.assertEqual(data['message'], 'unprocessable')
#
#    def test_get_questions_based_on_category(self):
#        res = self.client().get('/categories/1/questions')
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 200)
#        self.assertEqual(data['success'], True)
#        self.assertTrue(len(data['questions']))
#        self.assertTrue(data['total_questions'])
#        self.assertTrue(data['current_category'])
#    
#    def test_get_questions_with_invalid_category(self):
#        res = self.client().get('/categories/100/questions')
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 422)
#        self.assertEqual(data['success'], False)
#        self.assertEqual(data['message'], 'unprocessable')
#        
#    def test_get_questions_for_quiz(self):
#        res = self.client().post('quizzes', json={'quiz_category': { 'id': 1 }})
#        data = json.loads(res.data)
#        
#        self.assertEqual(res.status_code, 200)
#        self.assertEqual(data['success'], True)
#        self.assertTrue(len(data['question']))

if __name__ == "__main__":
    unittest.main()