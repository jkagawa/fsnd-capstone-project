import os
import re
import json
import secrets
import hashlib
import base64
import urllib.request
import urllib.parse
from flask import Flask, request, render_template, jsonify, flash, abort, redirect, session, g, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import text, func
from sqlalchemy.exc import IntegrityError
from models import setup_db, db_create_all, return_db, ClimbingSpot, Climber, VisitedSpot, Review
from auth import AuthError, requires_auth, verify_decode_jwt

AUTH0_DOMAIN = os.environ.get('AUTH0_DOMAIN', 'climbing-spot.auth0.com')
AUTH0_CLIENT_ID = os.environ.get('AUTH0_CLIENT_ID', 'NAl7V4YO9ort127uVV8OS3q1nmJPZ7or')
AUTH0_CLIENT_SECRET = os.environ.get('AUTH0_CLIENT_SECRET')
AUTH0_AUDIENCE = os.environ.get('AUTH0_AUDIENCE', 'climbing')
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5000')

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or os.urandom(32)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = BASE_URL.startswith('https')

setup_db(app)
CORS(app)
db = return_db()
db_create_all()

@app.before_request
def load_user_from_cookie():
    g.user = None
    g.permissions = []
    token = request.cookies.get('access_token')
    if token:
        try:
            payload = verify_decode_jwt(token)
            g.user = payload.get('sub')
            g.permissions = payload.get('permissions', [])
        except Exception:
            pass

@app.context_processor
def inject_user():
    return {
        'current_user': getattr(g, 'user', None),
        'user_permissions': getattr(g, 'permissions', []),
    }

def _set_rls_user():
    uid = getattr(g, 'user', '') or ''
    db.session.execute(text("SELECT set_config('app.current_user_id', :uid, TRUE)"), {"uid": uid})

# In-memory cache so repeat city/state lookups don't re-hit Nominatim
_GEOCODE_CACHE = {}

def geocode(city, state):
    """Best-effort geocode of a city/state to a "lat,lng" string via OSM Nominatim.
    Returns None on any failure so spot creation never breaks if the service is down."""
    if not city or not state:
        return None
    key = (city.strip().lower(), state.strip().lower())
    if key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[key]
    try:
        query = urllib.parse.urlencode({
            'q': '{}, {}, USA'.format(city.strip(), state.strip()),
            'format': 'json',
            'limit': 1,
        })
        req = urllib.request.Request(
            'https://nominatim.openstreetmap.org/search?' + query,
            headers={'User-Agent': 'ClimbingSpotApp/1.0 (https://climbing-spot.onrender.com)'},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            results = json.loads(resp.read().decode('utf-8'))
        if results:
            coords = '{},{}'.format(results[0]['lat'], results[0]['lon'])
            _GEOCODE_CACHE[key] = coords
            return coords
    except Exception:
        pass
    return None

def _generate_pkce_pair():
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode('utf-8')).digest()
    ).decode('utf-8').rstrip('=')
    return verifier, challenge

@app.route('/login')
def login():
    verifier, challenge = _generate_pkce_pair()
    state = secrets.token_urlsafe(32)
    session.permanent = True
    session['pkce_verifier'] = verifier
    session['oauth_state'] = state
    session['return_to'] = request.args.get('return_to', '/')

    params = urllib.parse.urlencode({
        'response_type': 'code',
        'client_id': AUTH0_CLIENT_ID,
        'redirect_uri': BASE_URL + '/callback',
        'audience': AUTH0_AUDIENCE,
        'scope': 'openid profile',
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
        'state': state,
    })
    return redirect('https://' + AUTH0_DOMAIN + '/authorize?' + params)

@app.route('/callback')
def callback():
    received_state = request.args.get('state')
    expected_state = session.pop('oauth_state', None)
    code = request.args.get('code')
    verifier = session.pop('pkce_verifier', None)
    return_to = session.pop('return_to', '/')

    if expected_state is None or verifier is None or received_state != expected_state or not code:
        abort(400)

    body = urllib.parse.urlencode({
        'grant_type': 'authorization_code',
        'client_id': AUTH0_CLIENT_ID,
        'client_secret': AUTH0_CLIENT_SECRET or '',
        'code': code,
        'redirect_uri': BASE_URL + '/callback',
        'code_verifier': verifier,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://' + AUTH0_DOMAIN + '/oauth/token',
        data=body,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            tokens = json.loads(resp.read().decode('utf-8'))
    except Exception:
        abort(401)

    access_token = tokens.get('access_token')
    if not access_token:
        abort(401)

    response = redirect(return_to)
    response.set_cookie(
        'access_token',
        access_token,
        httponly=True,
        secure=BASE_URL.startswith('https'),
        samesite='Lax',
        max_age=tokens.get('expires_in', 7200),
    )
    return response

@app.route('/logout')
def logout():
    response = redirect(
        'https://' + AUTH0_DOMAIN + '/v2/logout?' + urllib.parse.urlencode({
            'client_id': AUTH0_CLIENT_ID,
            'returnTo': BASE_URL,
        })
    )
    response.delete_cookie('access_token')
    return response

def _ratings_by_spot(spot_id=None):
    """Return {spot_id: {'avg': float, 'count': int}} aggregated from the Review table.
    Pass spot_id to scope the aggregate to a single spot."""
    q = db.session.query(
        Review.climbing_spot_id,
        func.avg(Review.rating),
        func.count(Review.id),
    )
    if spot_id is not None:
        q = q.filter(Review.climbing_spot_id == spot_id)
    q = q.group_by(Review.climbing_spot_id)
    return {row[0]: {'avg': round(float(row[1]), 1), 'count': row[2]} for row in q.all()}

def _spot_dict(climbingspot, climbers_by_sub, ratings):
    r = ratings.get(climbingspot.id, {'avg': 0, 'count': 0})
    owner = climbers_by_sub.get(climbingspot.added_by)
    added_by_name = owner.name if owner and owner.name else "Unknown"
    added_by_username = ("@" + owner.username if owner and owner.username
                         else "No username")
    return {
        "id" : climbingspot.id,
        "name" : climbingspot.name,
        "location" : climbingspot.location,
        "address_city" : climbingspot.address_city,
        "address_state" : climbingspot.address_state,
        "added_by" : climbingspot.added_by,
        "added_by_name" : added_by_name,
        "added_by_username" : added_by_username,
        "image_url" : climbingspot.image_url,
        "indoor_or_outdoor" : climbingspot.indoor_or_outdoor,
        "coordinates" : climbingspot.outdoor_coordinates,
        "rating_avg" : r['avg'],
        "rating_count" : r['count'],
    }

def get_climbing_spots():
    climbers_by_sub = {c.added_by: c for c in Climber.query.all() if c.added_by}
    ratings = _ratings_by_spot()
    spot = [_spot_dict(s, climbers_by_sub, ratings) for s in ClimbingSpot.query.order_by('id').all()]
    return {"spot": spot}

def get_climbing_spot(climbingspot_id):
    climbers_by_sub = {c.added_by: c for c in Climber.query.all() if c.added_by}
    climbingspot = ClimbingSpot.query.get(climbingspot_id)
    if not climbingspot:
        return None
    return _spot_dict(climbingspot, climbers_by_sub, _ratings_by_spot(climbingspot_id))

USERNAME_RE = re.compile(r'^[A-Za-z0-9_]{3,}$')


def validate_username(username):
    if not username:
        return 'Username is required'
    if not USERNAME_RE.match(username):
        return 'Username must be at least 3 characters and use only letters, numbers, and underscores'
    return None


def get_climbers():
    climber = []
    for climb in Climber.query.order_by('id').all():
        visitedspot = []
        visitedspot_id = []
        all_spots = []
        all_spots_id = []
        for visited in VisitedSpot.query.filter_by(climber_id=climb.id).order_by('climbing_spot_id').all():
            climbingspot = ClimbingSpot.query.filter_by(id=visited.climbing_spot_id).one_or_none()
            if climbingspot:
                visitedspot.append(climbingspot.name)
                visitedspot_id.append(climbingspot.id)
        for climbingspot in ClimbingSpot.query.order_by('id').all():
            all_spots.append(climbingspot.name)
            all_spots_id.append(climbingspot.id)
        climber.append({
            "id" : climb.id,
            "name" : climb.name,
            "username" : climb.username,
            "state" : climb.state,
            "added_by" : climb.added_by,
            "visited_spots" : visitedspot,
            "visited_spot_ids" : visitedspot_id,
            "all_spots" : all_spots,
            "all_spots_id" : all_spots_id,
            "len_all_spots" : len(all_spots)
        })
    climbers = {
        "climber" : climber
    }
    return climbers

@app.route('/')
def index():
    spot_count = ClimbingSpot.query.count()
    climber_count = Climber.query.count()
    climbers_by_sub = {c.added_by: c for c in Climber.query.all() if c.added_by}
    ratings = _ratings_by_spot()
    featured = [
        _spot_dict(s, climbers_by_sub, ratings)
        for s in ClimbingSpot.query.order_by(ClimbingSpot.id.desc()).limit(3).all()
    ]
    return render_template(
        'home.html',
        spot_count=spot_count,
        climber_count=climber_count,
        featured=featured,
    )

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/profile')
def profile():
    if not g.user:
        return redirect('/login?return_to=/profile')
    climber = Climber.query.filter_by(added_by=g.user).first()
    all_spots = ClimbingSpot.query.order_by('id').all()
    profile_data = None
    if climber:
        visited_ids = [vs.climbing_spot_id for vs in VisitedSpot.query.filter_by(climber_id=climber.id).order_by('climbing_spot_id').all()]
        visited_names = []
        for spot_id in visited_ids:
            spot = ClimbingSpot.query.filter_by(id=spot_id).one_or_none()
            if spot:
                visited_names.append(spot.name)
        profile_data = {
            'id': climber.id,
            'name': climber.name,
            'username': climber.username,
            'state': climber.state,
            'visited_spot_ids': visited_ids,
            'visited_spots': visited_names,
        }
    spots_list = [{'id': s.id, 'name': s.name} for s in all_spots]
    return render_template('profile.html', profile=profile_data, all_spots=spots_list)

#=================CLIMBING SPOT ENDPOINTS=================

@app.route('/climbing-spots', methods=['GET'])
@app.route('/api/climbing-spots', methods=['GET'])
def climbing_spots():
    error = False
    try:
        spots = get_climbing_spots()
    except:
        error = True
    if error:
        abort(404)
    else:
        if request.path == '/api/climbing-spots':
            return jsonify({
                'success': True,
                'spots': spots
            }), 200
        return render_template('climbing-spots.html', spots=spots)

def _review_dict(review):
    return {
        'id': review.id,
        'added_by': review.added_by,
        'author_name': review.author_name or 'Anonymous Climber',
        'rating': review.rating,
        'body': review.body or '',
        'created_at': review.created_at.strftime('%b %d, %Y') if review.created_at else '',
    }

def get_reviews(spot_id):
    reviews = Review.query.filter_by(climbing_spot_id=spot_id).order_by(Review.created_at.desc(), Review.id.desc()).all()
    return [_review_dict(r) for r in reviews]

@app.route('/climbing-spots/<int:climbingspot_id>', methods=['GET'])
@app.route('/api/climbing-spots/<int:climbingspot_id>', methods=['GET'])
def climbing_spot_detail(climbingspot_id):
    spot = get_climbing_spot(climbingspot_id)
    if not spot:
        abort(404)
    reviews = get_reviews(climbingspot_id)
    if request.path.startswith('/api/'):
        return jsonify({'success': True, 'spot': spot, 'reviews': reviews}), 200
    user_review = next((r for r in reviews if g.user and r['added_by'] == g.user), None)
    return render_template('spot-detail.html', spot=spot, reviews=reviews, user_review=user_review)

@app.route('/climbing-spots', methods=['POST'])
@app.route('/api/climbing-spots', methods=['POST'])
@requires_auth('post:climbing-spot')
def add_climbing_spots(payload):
    error = False
    try:
        _set_rls_user()
        name = request.json['name']
        address_city = request.json['city']
        address_state = request.json['state'].upper()
        location = address_city + ", " + address_state
        image_url = (request.get_json().get('image_url') or '').strip() or None
        coordinates = geocode(address_city, address_state)
        spot_id = request.get_json().get('id', None)

        if (spot_id):
            climbing_spot = ClimbingSpot(id=spot_id, name=name, location=location, address_city=address_city, address_state=address_state, added_by=payload['sub'], image_url=image_url, outdoor_coordinates=coordinates)
        else:
            climbing_spot = ClimbingSpot(name=name, location=location, address_city=address_city, address_state=address_state, added_by=payload['sub'], image_url=image_url, outdoor_coordinates=coordinates)

        db.session.add(climbing_spot)
        db.session.commit()
        new_spot_id = climbing_spot.id

        creator = Climber.query.filter_by(added_by=payload['sub']).first()
        creator_username = "@" + creator.username if creator and creator.username else None

        spots = get_climbing_spots()
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
        flash('An error occurred. Climbing spot "' + request.json['name'] + '" could not be added.')
        abort(400)
    else:
        if request.path == '/api/climbing-spots':
            return jsonify({
                'success': True,
                'spot': {
                    'id': new_spot_id,
                    'name': name,
                    'location': location,
                    'address_city': address_city,
                    'address_state': address_state,
                    'added_by': payload['sub'],
                    'added_by_username': creator_username,
                    'image_url': image_url,
                }
            }), 200
        flash('Climbing spot "' + name + '" was successfully added!')
        return render_template('climbing-spots.html', spots=spots)

@app.route('/climbing-spots/<int:climbingspot_id>', methods=['PATCH'])
@app.route('/api/climbing-spots/<int:climbingspot_id>', methods=['PATCH'])
@requires_auth('patch:climbing-spot')
def edit_climbingspots(payload, climbingspot_id):
    climbingspot = ClimbingSpot.query.get_or_404(climbingspot_id)
    if climbingspot.added_by != payload['sub']:
        abort(403)
    error = False
    try:
        _set_rls_user()
        name = request.json['name']
        address_city = request.json['city']
        address_state = request.json['state'].upper()
        location = address_city + ", " + address_state
        image_url = (request.get_json().get('image_url') or '').strip() or None

        climbingspot = ClimbingSpot.query.get(climbingspot_id)
        # Re-geocode only when the location changed (or was never geocoded);
        # keep the existing coordinate if the lookup fails.
        if (climbingspot.address_city != address_city
                or climbingspot.address_state != address_state
                or not climbingspot.outdoor_coordinates):
            new_coords = geocode(address_city, address_state)
            if new_coords:
                climbingspot.outdoor_coordinates = new_coords
        climbingspot.name = name
        climbingspot.address_city = address_city
        climbingspot.address_state = address_state
        climbingspot.location = location
        climbingspot.image_url = image_url
        db.session.commit()

        spots = get_climbing_spots()
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
        flash('An error occurred. Climbing spot "' + request.json['name'] + '" could not be added.')
        abort(400)
    else:
        if request.path == '/api/climbing-spots/' + str(climbingspot_id):
            return jsonify({
                'success': True,
                'id': climbingspot_id,
                'name' : name,
                'location' : location,
                'city' : address_city,
                'state' : address_state,
                'image_url' : image_url
            }), 200
        flash('Climbing spot "' + request.json['name'] + '" was successfully added!')
        return render_template('climbing-spots.html', spots=spots)

@app.route('/climbing-spots/<int:climbingspot_id>', methods=['DELETE'])
@app.route('/api/climbing-spots/<int:climbingspot_id>', methods=['DELETE'])
@requires_auth('delete:climbing-spot')
def remove_climbingspots(payload, climbingspot_id):
    climbingspot = ClimbingSpot.query.get_or_404(climbingspot_id)
    if climbingspot.added_by != payload['sub']:
        abort(403)
    error = False
    try:
        _set_rls_user()
        climbingspot = ClimbingSpot.query.get(climbingspot_id)
        name = climbingspot.name
        location = climbingspot.location
        for vs in VisitedSpot.query.filter_by(climbing_spot_id=climbingspot_id).all():
            db.session.delete(vs)
        for rv in Review.query.filter_by(climbing_spot_id=climbingspot_id).all():
            db.session.delete(rv)
        db.session.delete(climbingspot)
        db.session.commit()

        spots = get_climbing_spots()
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
        if request.path == '/api/climbing-spots/' + str(climbingspot_id):
            return jsonify({
                'success': True,
                'id': climbingspot_id,
                'name' : name,
                'location' : location
            }), 200
        return render_template('climbing-spots.html', spots=spots)

#=================CLIMBER ENDPOINTS=================

@app.route('/climbers', methods=['GET'])
@app.route('/api/climbers', methods=['GET'])
def climbers():
    error = False
    try:
        climbers = get_climbers()
    except:
        error = True
    if error:
        abort(404)
    else:
        if request.path == '/api/climbers':
            return jsonify({
                'success': True,
                'climbers': climbers
            }), 200
        return render_template('climbers.html', climbers=climbers)

@app.route('/climbers', methods=['POST'])
@app.route('/api/climbers', methods=['POST'])
@requires_auth('post:climber')
def add_climbers(payload):
    existing = Climber.query.filter_by(added_by=payload['sub']).first()
    if existing:
        abort(409)

    def _error(msg, code):
        if request.path == '/api/climbers':
            return jsonify({'success': False, 'message': msg}), code
        flash(msg)
        abort(code)

    username = (request.json.get('username') or '').strip()
    msg = validate_username(username)
    if msg:
        return _error(msg, 400)
    taken = Climber.query.filter(func.lower(Climber.username) == username.lower()).first()
    if taken:
        return _error('That username is already taken', 409)

    error = False
    conflict = False
    try:
        _set_rls_user()
        name = request.json['name']
        state = request.json['state']
        visited_spots = request.json['visited_spots']
        climber_id = request.get_json().get('id', None)

        if (climber_id):
            climber = Climber(id=climber_id, name=name, state=state, username=username, added_by=payload['sub'])
        else:
            climber = Climber(name=name, state=state, username=username, added_by=payload['sub'])

        db.session.add(climber)
        db.session.flush()
        new_climber_id = climber.id
        for spot_id in visited_spots:
            visitedspots = VisitedSpot(climbing_spot_id=spot_id, climber_id=climber.id)
            db.session.add(visitedspots)
        db.session.commit()

        climbers = get_climbers()
    except IntegrityError:
        db.session.rollback()
        conflict = True
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if conflict:
        return _error('That username is already taken', 409)
    if error:
        flash('An error occurred. Climber profile could not be created.')
        abort(400)
    else:
        if request.path == '/api/climbers':
            return jsonify({
                'success': True,
                'climber': {
                    'id': new_climber_id,
                    'name': name,
                    'username': username,
                    'state': state,
                    'visited_count': len(visited_spots),
                    'visited_spot_ids': visited_spots,
                    'added_by': payload['sub'],
                }
            }), 200
        flash('Climber profile was successfully created!')
        return render_template('climbers.html', climbers=climbers)

@app.route('/climbers/<int:climber_id>', methods=['PATCH'])
@app.route('/api/climbers/<int:climber_id>', methods=['PATCH'])
@requires_auth('patch:climber')
def edit_climbers(payload, climber_id):
    climber = Climber.query.get_or_404(climber_id)
    if climber.added_by != payload['sub']:
        abort(403)
    error = False
    try:
        _set_rls_user()
        name = request.json['name']
        state = request.json['state']
        new_visited_spots = request.json['visited_spots']

        climber = Climber.query.get(climber_id)
        climber.name = name
        climber.state = state

        old_visited_spots = VisitedSpot.query.filter_by(climber_id=climber_id)
        for new_spot_id in new_visited_spots:
            visited = old_visited_spots.filter_by(climbing_spot_id=new_spot_id).one_or_none()
            if visited == None:
                visitedspots = VisitedSpot(climbing_spot_id=new_spot_id, climber_id=climber_id)
                db.session.add(visitedspots)
        for old_spot in old_visited_spots.all():
            count = 0
            for new_spot in new_visited_spots:
                if old_spot.climbing_spot_id == new_spot:
                    count = count + 1
            if count == 0:
                specific_spot = old_visited_spots.filter_by(climbing_spot_id=old_spot.climbing_spot_id).one_or_none()
                db.session.delete(specific_spot)
        db.session.commit()

        climbers = get_climbers()
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
        flash('An error occurred. Climber profile could not be updated.')
        abort(400)
    else:
        if request.path == '/api/climbers/' + str(climber_id):
            return jsonify({
                'success': True,
                'id': climber_id,
                'name': name,
                'state': state,
                'visited_count': len(new_visited_spots),
                'visited_spot_ids': new_visited_spots,
            }), 200
        flash('Climber profile was successfully updated!')
        return render_template('climbers.html', climbers=climbers)

@app.route('/climbers/<int:climber_id>', methods=['DELETE'])
@app.route('/api/climbers/<int:climber_id>', methods=['DELETE'])
@requires_auth('delete:climber')
def remove_climbers(payload, climber_id):
    climber = Climber.query.get_or_404(climber_id)
    if climber.added_by != payload['sub']:
        abort(403)
    error = False
    try:
        _set_rls_user()
        visited_spots = VisitedSpot.query.filter_by(climber_id=climber_id)
        for visited_spot in visited_spots.all():
            specific_spot = visited_spots.filter_by(climbing_spot_id=visited_spot.climbing_spot_id).one_or_none()
            db.session.delete(specific_spot)

        climber = Climber.query.get(climber_id)
        name = climber.name
        db.session.delete(climber)

        db.session.commit()

        climbers = get_climbers()
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
            }), 200
        return render_template('climbers.html', climbers=climbers)

#=================REVIEW ENDPOINTS=================

@app.route('/api/climbing-spots/<int:climbingspot_id>/reviews', methods=['POST'])
def add_review(climbingspot_id):
    if not g.user:
        abort(401)
    ClimbingSpot.query.get_or_404(climbingspot_id)
    if Review.query.filter_by(climbing_spot_id=climbingspot_id, added_by=g.user).first():
        abort(409)
    data = request.get_json(silent=True) or {}
    try:
        rating = int(data.get('rating', 0))
    except (TypeError, ValueError):
        rating = 0
    if rating < 1 or rating > 5:
        abort(400)
    body = (data.get('body') or '').strip()
    error = False
    try:
        _set_rls_user()
        climber = Climber.query.filter_by(added_by=g.user).first()
        author_name = climber.name if climber and climber.name else 'Anonymous Climber'
        review = Review(climbing_spot_id=climbingspot_id, added_by=g.user, author_name=author_name, rating=rating, body=body)
        db.session.add(review)
        db.session.commit()
        result = _review_dict(review)
        agg = _ratings_by_spot(climbingspot_id).get(climbingspot_id, {'avg': rating, 'count': 1})
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
        abort(400)
    return jsonify({'success': True, 'review': result, 'rating_avg': agg['avg'], 'rating_count': agg['count']}), 200

@app.route('/api/reviews/<int:review_id>', methods=['PATCH'])
def edit_review(review_id):
    if not g.user:
        abort(401)
    review = Review.query.get_or_404(review_id)
    if review.added_by != g.user:
        abort(403)
    data = request.get_json(silent=True) or {}
    try:
        rating = int(data.get('rating', review.rating))
    except (TypeError, ValueError):
        rating = 0
    if rating < 1 or rating > 5:
        abort(400)
    body = (data.get('body') or '').strip()
    spot_id = review.climbing_spot_id
    error = False
    try:
        _set_rls_user()
        review = Review.query.get(review_id)
        review.rating = rating
        review.body = body
        db.session.commit()
        result = _review_dict(review)
        agg = _ratings_by_spot(spot_id).get(spot_id, {'avg': rating, 'count': 1})
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
        abort(400)
    return jsonify({'success': True, 'review': result, 'rating_avg': agg['avg'], 'rating_count': agg['count']}), 200

@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def remove_review(review_id):
    if not g.user:
        abort(401)
    review = Review.query.get_or_404(review_id)
    if review.added_by != g.user:
        abort(403)
    spot_id = review.climbing_spot_id
    error = False
    try:
        _set_rls_user()
        db.session.delete(Review.query.get(review_id))
        db.session.commit()
        agg = _ratings_by_spot(spot_id).get(spot_id, {'avg': 0, 'count': 0})
    except:
        db.session.rollback()
        error = True
    finally:
        db.session.close()
    if error:
        abort(400)
    return jsonify({'success': True, 'id': review_id, 'rating_avg': agg['avg'], 'rating_count': agg['count']}), 200

@app.errorhandler(400)
def unauthorized(error):
    return jsonify({
        "success": False,
        "error": 400,
        "message": "bad request"
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        "success": False,
        "error": 401,
        "message": "unauthorized"
    }), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        "success": False,
        "error": 403,
        "message": "you do not have permission to modify this resource"
    }), 403

@app.errorhandler(404)
def notfound(error):
    return jsonify({
        "success": False,
        "error": 404,
        "message": "resource not found"
    }), 404

@app.errorhandler(409)
def conflict(error):
    return jsonify({
        "success": False,
        "error": 409,
        "message": "you already have a climber profile"
    }), 409


#if __name__ == '__main__':
#    app.run(host='127.0.0.1', port=81, debug=True)

if __name__ == '__main__':
    app.run(debug=True)
