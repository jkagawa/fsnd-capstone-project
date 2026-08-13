// Shared Leaflet helpers for the spots list map and the spot-detail mini-map.

var TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function parseCoords(str) {
    if (!str) return null;
    var parts = String(str).split(',');
    if (parts.length !== 2) return null;
    var lat = parseFloat(parts[0]);
    var lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
}

function escAttr(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function popupHtml(spot) {
    var detailUrl = '/climbing-spots/' + spot.id;
    var html = '<div class="map-popup">';
    if (spot.image_url) {
        html += '<a href="' + detailUrl + '"><img src="' + escAttr(spot.image_url) +
            '" class="map-popup-photo" onerror="this.style.display=\'none\'"></a>';
    }
    html += '<a href="' + detailUrl + '" class="map-popup-name">' + escAttr(spot.name) + '</a>' +
        '<div class="map-popup-loc">' + escAttr(spot.location) + '</div></div>';
    return html;
}

// ── Spots list map with a Map / List toggle ─────────────────────────
(function initListMap() {
    var mapEl = document.getElementById('map');
    var listBtn = document.getElementById('view-list-btn');
    var mapBtn = document.getElementById('view-map-btn');
    if (!mapEl || !listBtn || !mapBtn) return;

    var map = null;
    var loaded = false;

    function buildMap() {
        map = L.map('map');
        L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);

        fetch('/api/climbing-spots')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var spots = (data.spots && data.spots.spot) || [];
                var bounds = [];
                spots.forEach(function(spot) {
                    var c = parseCoords(spot.coordinates);
                    if (!c) return;
                    // 'geocode' (and legacy null) is a city-centroid guess, not the crag.
                    // Draw it as an area so it doesn't imply precision it doesn't have.
                    if (spot.coord_source === 'geocode' || !spot.coord_source) {
                        L.circle(c, {
                            radius: 4000,
                            color: '#0080ff',
                            weight: 1,
                            fillColor: '#0080ff',
                            fillOpacity: 0.15
                        }).addTo(map).bindPopup(popupHtml(spot));
                    } else {
                        L.marker(c).addTo(map).bindPopup(popupHtml(spot));
                    }
                    bounds.push(c);
                });
                if (bounds.length) {
                    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
                } else {
                    map.setView([39.5, -98.35], 4); // continental US
                }
            })
            .catch(function() {
                map.setView([39.5, -98.35], 4);
            });
    }

    function showMap() {
        mapEl.style.display = 'block';
        document.querySelector('.cards-list').style.display = 'none';
        var pag = document.getElementById('pagination-wrap');
        if (pag) pag.style.display = 'none';
        mapBtn.classList.add('view-toggle-active');
        listBtn.classList.remove('view-toggle-active');
        if (!loaded) { buildMap(); loaded = true; }
        setTimeout(function() { if (map) map.invalidateSize(); }, 0);
    }

    function showList() {
        mapEl.style.display = 'none';
        document.querySelector('.cards-list').style.display = '';
        listBtn.classList.add('view-toggle-active');
        mapBtn.classList.remove('view-toggle-active');
        if (typeof renderPage === 'function') renderPage();
    }

    mapBtn.addEventListener('click', showMap);
    listBtn.addEventListener('click', showList);
})();

// ── Spot-detail mini-map ────────────────────────────────────────────
(function initDetailMap() {
    var el = document.getElementById('spot-map');
    if (!el) return;
    var c = parseCoords(el.getAttribute('data-coords'));
    if (!c) return;
    var map = L.map('spot-map').setView(c, 12);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);
    L.marker(c).addTo(map).bindPopup(escAttr(el.getAttribute('data-name')));
})();
