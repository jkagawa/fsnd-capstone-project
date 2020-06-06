Rock Climbing Spot App
-----

### Introduction

This is an application that enables the discovery of rock climbing locations and rock climbers around the world. You can browse the climbers featured in this application and see which climbing locations they have been to.

This application is powered by an API that conforms to the REST architectural style. The API returns JSON-encoded responses and uses standard HTTP response codes.

### Accessing the climbing app on the web

Visit the following URL to see the app in action:

* https://climbing-spot-app.herokuapp.com

This app connects to a Postgres server hosted in Heroku. Anyone can view the climbing locations and climbers. An account login with specific permissions is needed in order to add, edit, and remove climbing locations and climber profiles. These are specified below.

Administrator login (can add, edit, and remove climbing locations and climber profiles):
* email: joshuakagawa@gmail.com
* password: User1admin

Climber login (can add, edit, and remove climber profiles only):
* email: joshuakagawa_3@yahoo.com
* password: User2climber

### Running the climbing app on your local machine

##### 1. Initialize and activate a virtual environment:

Run this in the terminal:

```bash
cd YOUR_PROJECT_DIRECTORY_PATH/
virtualenv --no-site-packages env OR virtualenv env
source env/bin/activate (MacOS/Linux) OR source env/Scripts/activate (Windows)
```

Additional instructions can be found [here](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/).

##### 2. Install the dependencies:

In the project folder, run the following:
```bash
pip install -r requirements.txt OR pip3 install -r requirements.txt
```

##### 3. Run the app
In the project folder, run the following:

```bash
python app.py
```

The app connects to a Postgres database hosted in Heroku, so there is no need to run the database server locally.

### Running Unittest on the API endpoints in your local machine

Multiple tests have been created in order to test that the behavior of the endpoints are as expected.

##### Run the tests
Assuming the virtual environment has been initlaized / activated and the dependencies have been installed based on the instructions above, run the following in the project folder:

```bash
python test_app.py
```
This test also connects to a Postgres database hosted in Heroku, so there is no need to run the database server locally.

### API Endpoints

##### HTTP Status Codes

200 - OK (The request has succeeded)

400 - Bad Request (The server cannot process the request due to a client error)

401 - Unauthorized (The request requires user authentication)

403 - Forbidden (The server understood the request, but is refusing to fulfill it)

404 - Not Found	(The requested resource doesn't exist)

##### Base URL
> https://climbing-spot-app.herokuapp.com

##### Get climbing spots (GET Method)
> /climbing-spots

##### Add climbing spot (POST Method)
> /climbing-spots

Request requirements (id is optional)

> body:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'id' : '[SPOT ID]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'name' : '[SPOT NAME]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'location' : '[SPOT CITY AND STATE]'  
> }  
> headers:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Content-Type': 'application/json',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + [ACCESS TOKEN]  
> }

##### Edit climbing spot (PATCH Method)
> /climbing-spots/[SPOT ID]

Request requirements

> body:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'name' : '[SPOT NAME]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'location' : '[SPOT CITY AND STATE]'  
> }  
> headers:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Content-Type': 'application/json',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + [ACCESS TOKEN]  
> }

##### Remove climbing spot (DELETE Method)
> /climbing-spots/[SPOT ID]

Request requirements

> headers:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + [ACCESS TOKEN]  
> }

##### Get climbers (GET Method)

> /climbers

##### Add climber (POST Method)
> /climbers

Request requirements (id is optional)

> body:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'id' : '[CLIMBER ID]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'name' : '[CLIMBER NAME]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'state' : '[CLIMBER STATE]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'visited_spots' : '[SPOT IDS SEPARATED BY COMMA]'  
> }  
> headers:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Content-Type': 'application/json',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + [ACCESS TOKEN]  
> }

##### Edit climber (PATCH Method)
> /climbers/[CLIMBER ID]

Request requirements

> body:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'name' : '[CLIMBER NAME]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'state' : '[CLIMBER STATE]',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'visited_spots' : '[SPOT IDS SEPARATED BY COMMA]'  
> }  
> headers:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Content-Type': 'application/json',  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + [ACCESS TOKEN]  
> }

##### Remove climber (DELETE Method)
> /climbing-spots/[CLIMBER ID]

Request requirements

> headers:  
> {  
> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Authorization': 'Bearer ' + [ACCESS TOKEN]  
> }


### Author

This documentation was created by Joshua Kagawa