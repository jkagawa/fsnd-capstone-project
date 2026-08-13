"""One-off: geocode existing climbing spots that have no coordinates yet.

Run with the project virtualenv active:
    python backfill_coords.py
Respects Nominatim's ~1 req/sec policy by sleeping between uncached lookups.
"""
import time
from app import app, db, geocode
from models import ClimbingSpot

with app.app_context():
    # Only ever fill in blanks. Rows whose coord_source is user-set ('search', 'pin',
    # 'paste') are left alone so a re-run can't overwrite a hand-placed coordinate.
    spots = ClimbingSpot.query.filter(
        ((ClimbingSpot.outdoor_coordinates.is_(None)) | (ClimbingSpot.outdoor_coordinates == ''))
        & (ClimbingSpot.coord_source.is_(None)
           | ClimbingSpot.coord_source.notin_(('search', 'pin', 'paste')))
    ).all()
    print('Spots needing coordinates: {}'.format(len(spots)))
    updated = 0
    for spot in spots:
        coords = geocode(spot.address_city, spot.address_state)
        if coords:
            spot.outdoor_coordinates = coords
            spot.coord_source = 'geocode'
            updated += 1
            print('  #{} {} ({}, {}) -> {}'.format(
                spot.id, spot.name, spot.address_city, spot.address_state, coords))
        else:
            print('  #{} {} ({}, {}) -> no result'.format(
                spot.id, spot.name, spot.address_city, spot.address_state))
        time.sleep(1)
    db.session.commit()
    print('Done. Updated {} of {} spots.'.format(updated, len(spots)))
