// Coordinate picker for the add/edit climbing spot forms.
//
// One control, three ways to set the same value: search a place by name, drag a
// pin, or paste a "lat,lng" / map URL. Everything writes to a single hidden input
// holding "lat,lng"; the submit handlers in climbing-spots.js read it via getValue().
//
// Loaded after map.js so TILE_URL / TILE_ATTR / parseCoords are available.

// Where the map opens when there is no pin and no city typed yet: continental US,
// the same fallback view map.js uses.
var PICKER_DEFAULT_VIEW = [39.5, -98.35];
var PICKER_DEFAULT_ZOOM = 3;

// Accepts a bare "lat,lng" or a map URL pasted from a phone/browser. Returns a
// normalized "lat,lng" string, or null if the text isn't a coordinate at all (in
// which case the caller treats it as a place-search query).
function parseCoordInput(text) {
    var raw = String(text == null ? '' : text).trim();
    if (!raw) return null;

    var candidates = [];
    // Google Maps: .../@39.7392,-104.9903,14z
    var at = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (at) candidates.push([at[1], at[2]]);
    // Google Maps place data: !3d39.7392!4d-104.9903
    var d3d4 = raw.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (d3d4) candidates.push([d3d4[1], d3d4[2]]);
    // Google Maps / generic query param: ?q=39.7392,-104.9903 (also &query=, &ll=)
    var q = raw.match(/[?&](?:q|query|ll|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (q) candidates.push([q[1], q[2]]);
    // OpenStreetMap: #map=14/39.7392/-104.9903
    var osm = raw.match(/#map=\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
    if (osm) candidates.push([osm[1], osm[2]]);
    // Bare pair: "39.7392, -104.9903" (only when the whole string is the pair, so
    // an address like "5 Main St, Denver" doesn't get misread as coordinates)
    var bare = raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (bare) candidates.push([bare[1], bare[2]]);

    for (var i = 0; i < candidates.length; i++) {
        var lat = parseFloat(candidates[i][0]);
        var lng = parseFloat(candidates[i][1]);
        // parseCoords in map.js doesn't range-check, so do it here.
        if (isNaN(lat) || isNaN(lng)) continue;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
        return lat.toFixed(5) + ',' + lng.toFixed(5);
    }
    return null;
}

// prefix is 'add' or 'edit' and matches the element ids emitted by the
// coord_picker macro in templates/_macros.html.
function createCoordPicker(prefix) {
    var els = {
        wrap: document.getElementById(prefix + '-coord-picker'),
        input: document.getElementById(prefix + '-coord-search'),
        button: document.getElementById(prefix + '-coord-search-btn'),
        results: document.getElementById(prefix + '-coord-results'),
        mapEl: document.getElementById(prefix + '-coord-map'),
        hidden: document.getElementById(prefix + '-coord-value'),
        readout: document.getElementById(prefix + '-coord-readout'),
        clear: document.getElementById(prefix + '-coord-clear'),
        // The form's own Name field, used to label a hand-placed pin.
        nameInput: document.getElementById(
            prefix === 'edit' ? 'new-climbing-spot-name' : 'climbing-spot-name')
    };
    if (!els.wrap || !els.hidden || !els.mapEl) return null;

    var map = null;
    var marker = null;
    var source = null;
    // False until the user actually picks something in this form session. Prefilling
    // the edit form must not count: otherwise just opening and saving would relabel
    // an approximate 'geocode' coordinate as a precise one.
    var touched = false;

    // Every user-driven path goes through this rather than setValue directly.
    function setValueFromUser(coords, newSource, label) {
        touched = true;
        setValue(coords, newSource, label);
    }

    // Nominatim display_name is a full address chain ("Movement Denver, 1155 West 5th
    // Avenue, Lincoln Park, Denver, Denver County, Colorado, 80204, United States").
    // Only the leading parts identify the place; the rest won't fit on a map label.
    function shortLabel(displayName) {
        var parts = String(displayName || '').split(',');
        return parts.slice(0, 2).join(',').trim();
    }

    // A pin the user placed by hand has no name of its own, so fall back to whatever
    // they typed in the form's Name field before showing bare coordinates.
    function labelFor(explicitLabel, coords) {
        if (explicitLabel) return explicitLabel;
        var typed = els.nameInput && els.nameInput.value.trim();
        return typed || coords;
    }

    function setValue(coords, newSource, label) {
        els.hidden.value = coords || '';
        source = coords ? newSource : null;
        if (coords) {
            var c = parseCoords(coords);
            els.readout.textContent = coords;
            els.wrap.classList.add('coord-picker-set');
            if (map && c) {
                if (marker) {
                    marker.setLatLng(c);
                } else {
                    marker = L.marker(c, { draggable: true }).addTo(map);
                    marker.on('dragend', function() {
                        var p = marker.getLatLng();
                        setValueFromUser(p.lat.toFixed(5) + ',' + p.lng.toFixed(5), 'pin');
                    });
                }
                // Permanent tooltip so the place reads as a named location, not just a pin.
                marker.unbindTooltip();
                // Leaflet's default marker icon has tooltipAnchor [16, -28], which is
                // tuned for a right-side tooltip. For 'top' the x=16 pushes the label
                // off-centre, so cancel it; y=-16 seats the label just above the pin
                // head (the icon is 41px tall, anchored at its tip).
                marker.bindTooltip(labelFor(label, coords), {
                    permanent: true,
                    direction: 'top',
                    offset: [-16, -16],
                    className: 'coord-pin-label'
                });
                map.setView(c, Math.max(map.getZoom(), 13));
            }
        } else {
            els.readout.textContent = 'No pin set — will fall back to the city center';
            els.wrap.classList.remove('coord-picker-set');
            if (marker && map) {
                map.removeLayer(marker);
                marker = null;
            }
        }
    }

    function buildMap() {
        map = L.map(els.mapEl.id, {
            // The form scrolls; a wheel-zooming map inside it would trap the scroll.
            scrollWheelZoom: false
        }).setView(PICKER_DEFAULT_VIEW, PICKER_DEFAULT_ZOOM);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);
        map.on('click', function(e) {
            setValueFromUser(e.latlng.lat.toFixed(5) + ',' + e.latlng.lng.toFixed(5), 'pin');
        });
    }

    function clearResults() {
        els.results.innerHTML = '';
        els.results.style.display = 'none';
    }

    function renderResults(results) {
        els.results.innerHTML = '';
        if (!results.length) {
            var none = document.createElement('div');
            none.className = 'coord-result coord-result-empty';
            none.textContent = 'No matches. Try a broader name, or drop a pin on the map.';
            els.results.appendChild(none);
        } else {
            results.forEach(function(r) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'coord-result';
                btn.textContent = r.display_name;
                btn.onclick = function() {
                    setValueFromUser(r.coordinates, 'search', shortLabel(r.display_name));
                    clearResults();
                };
                els.results.appendChild(btn);
            });
        }
        els.results.style.display = 'block';
    }

    function runSearch() {
        var text = els.input.value.trim();
        if (!text) return;

        // A pasted coordinate or map URL resolves locally -- no network call.
        var pasted = parseCoordInput(text);
        if (pasted) {
            setValueFromUser(pasted, 'paste');
            clearResults();
            els.input.value = '';
            return;
        }

        var originalText = els.button.textContent;
        els.button.disabled = true;
        els.button.textContent = '...';
        fetch('/api/place-search?q=' + encodeURIComponent(text))
            .then(function(res) {
                if (!res.ok) throw new Error('search failed');
                return res.json();
            })
            .then(function(data) {
                els.button.disabled = false;
                els.button.textContent = originalText;
                renderResults(data.results || []);
            })
            .catch(function() {
                els.button.disabled = false;
                els.button.textContent = originalText;
                renderResults([]);
            });
    }

    els.button.onclick = function(e) {
        e.preventDefault();
        runSearch();
    };
    // The surrounding <form> would submit on Enter; intercept it.
    els.input.onkeydown = function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            runSearch();
        }
    };
    els.clear.onclick = function(e) {
        e.preventDefault();
        setValueFromUser(null, null);
        clearResults();
    };

    return {
        // coordsStr prefills an existing value (edit form); pass null for a fresh form.
        open: function(coordsStr) {
            if (!map) buildMap();
            els.input.value = '';
            clearResults();
            setValue(parseCoords(coordsStr) ? coordsStr : null, null);
            touched = false;
            // Leaflet can't measure a container that was display:none until now.
            setTimeout(function() {
                if (!map) return;
                map.invalidateSize();
                var c = parseCoords(els.hidden.value);
                map.setView(c || PICKER_DEFAULT_VIEW, c ? 13 : PICKER_DEFAULT_ZOOM);
            }, 0);
        },
        // Called from closeForm(); that function does not clear inputs itself, so
        // without this a pin would leak from one form open to the next.
        reset: function() {
            els.input.value = '';
            clearResults();
            setValue(null, null);
            touched = false;
        },
        // An untouched picker sends nothing at all, so the server keeps whatever the
        // spot already had. clear_coords is how "Clear pin" asks for the city-center
        // fallback back -- an empty coordinate on its own reads as "not supplied".
        getValue: function() {
            if (!touched) return {};
            if (!els.hidden.value) return { clear_coords: true };
            return { coordinates: els.hidden.value, coord_source: source };
        }
    };
}

// Instantiate once the DOM exists. climb.js checks for these globals and no-ops on
// pages (climbers, profile) that have no picker markup.
(function initSpotPickers() {
    if (!document.getElementById('add-coord-picker')) return;
    window.spotPickerAdd = createCoordPicker('add');
    window.spotPickerEdit = createCoordPicker('edit');
})();
