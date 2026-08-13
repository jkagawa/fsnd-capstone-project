var currentPage = 1;
var PAGE_SIZE = 5;


function renderPage() {
    var query = document.getElementById('search-spots').value.toLowerCase();
    var myEl = document.getElementById('filter-my-spots');
    var mineOnly = !!(myEl && myEl.checked);
    var allCards = Array.from(document.querySelectorAll('.card-spot'));

    var filtered = allCards.filter(function(card) {
        if (mineOnly && card.getAttribute('data-added-by') !== USER_SUB) return false;
        var text = [
            card.querySelector('.card-title.item2'),
            card.querySelector('.card-body.item3'),
            card.querySelector('.item1')
        ].map(function(el) { return el ? el.textContent : ''; }).join(' ').toLowerCase();
        return text.includes(query);
    });

    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * PAGE_SIZE;

    allCards.forEach(function(card) { card.style.display = 'none'; });
    filtered.slice(start, start + PAGE_SIZE).forEach(function(card) {
        card.style.display = '';
    });

    document.getElementById('search-no-results').style.display =
        filtered.length === 0 && (query || mineOnly) ? 'block' : 'none';

    var total = allCards.length;
    var countEl = document.getElementById('spots-count');
    if (mineOnly || (query && filtered.length !== total)) {
        countEl.textContent = 'Search result: ' + filtered.length + ' of ' + total + ' spot' + (total !== 1 ? 's' : '');
    } else {
        countEl.textContent = total + ' spot' + (total !== 1 ? 's' : '');
    }

    var wrap = document.getElementById('pagination-wrap');
    if (totalPages <= 1) {
        wrap.style.display = 'none';
    } else {
        wrap.style.display = 'flex';
        document.getElementById('pagination-info').textContent =
            'Page ' + currentPage + ' of ' + totalPages;
        document.getElementById('pagination-prev').disabled = currentPage === 1;
        document.getElementById('pagination-next').disabled = currentPage === totalPages;
    }
}

document.getElementById('search-spots').addEventListener('input', function() {
    currentPage = 1;
    renderPage();
});

var myFilterEl = document.getElementById('filter-my-spots');
if (myFilterEl) {
    myFilterEl.addEventListener('change', function() {
        currentPage = 1;
        renderPage();
        if (myFilterEl.checked) pulseVisibleCards();
    });
}

function pulseVisibleCards() {
    Array.from(document.querySelectorAll('.card-spot'))
        .filter(function(card) { return card.style.display !== 'none'; })
        .forEach(function(card) {
            card.classList.remove('pulse-mine');
            void card.offsetWidth;          // force reflow to restart the animation
            card.classList.add('pulse-mine');
            card.addEventListener('animationend', function handler(e) {
                if (e.animationName !== 'my-spots-pulse') return;   // wait for the pulse, not the ease
                card.classList.remove('pulse-mine');
                card.removeEventListener('animationend', handler);
            });
        });
}

document.getElementById('pagination-prev').onclick = function() {
    if (currentPage > 1) { currentPage--; renderPage(); }
};
document.getElementById('pagination-next').onclick = function() {
    currentPage++; renderPage();
};

renderPage();

function buildSpotCard(spot) {
    var canEdit = USER_PERMISSIONS && USER_PERMISSIONS.includes('patch:climbing-spot');
    var canDelete = USER_PERMISSIONS && USER_PERMISSIONS.includes('delete:climbing-spot');
    var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(spot.name + ', ' + spot.location);
    var detailUrl = '/climbing-spots/' + spot.id;

    var html = '';
    if (spot.image_url) {
        html += '<a href="' + detailUrl + '"><img src="' + escHtml(spot.image_url) +
            '" alt="' + escHtml(spot.name) + '" class="card-photo" onerror="this.style.display=\'none\'"></a>';
    } else {
        html += '<a href="' + detailUrl + '"><div class="card-photo-fallback">&#9968;</div></a>';
    }
    html += '<div class="card-spot-inner">' +
        '<span class="card-pill card-pill-own">Added by you</span>' +
        '<div class="grid-container">' +
        '<div class="item1">' + escHtml(spot.address_state) + '</div>' +
        '<div class="card-title item2"><a href="' + detailUrl + '" class="card-title-link">' + escHtml(spot.name) + '</a></div>' +
        '<div class="card-body item3">' + escHtml(spot.location) + '</div>' +
        '<div class="card-body item4"><a href="' + mapsUrl + '" target="_blank" class="card-body-link">Open in Google Maps &rarr;</a></div>' +
        '<div class="card-body item5">Added by ' + escHtml(spot.added_by_username || 'No username') + '</div>' +
        (spot.date_added ? '<div class="card-body item6">Added ' + escHtml(spot.date_added) + '</div>' : '') +
        '</div>' +
        '<div class="card-meta-row">' +
        '<span class="star-row" data-spot-rating="' + spot.id + '"><span class="star-empty">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <span class="star-count">No ratings yet</span></span>' +
        '</div>';
    if (canEdit || canDelete) {
        html += '<div class="card-settings-wrap">' +
            '<button class="button-settings" onclick="toggleSettings(this)">Edit</button>' +
            '<div class="settings-menu">';
        if (canEdit) {
            html += '<button class="settings-item"' +
                ' data-id="' + spot.id + '"' +
                ' data-name="' + escHtml(spot.name) + '"' +
                ' data-city="' + escHtml(spot.address_city) + '"' +
                ' data-state="' + escHtml(spot.address_state) + '"' +
                ' data-image="' + escHtml(spot.image_url || '') + '"' +
                ' data-coords="' + escHtml(spot.coordinates || '') + '"' +
                ' onclick="openEditSpot(this)">Edit Spot</button>';
        }
        if (canDelete) {
            html += '<button class="settings-item settings-item-danger"' +
                ' data-id="' + spot.id + '"' +
                ' onclick="removeSpot(this)">Delete Spot</button>';
        }
        html += '</div></div>';
    }
    html += '</div>';
    var card = document.createElement('div');
    card.className = 'card-spot';
    card.setAttribute('data-added-by', spot.added_by || '');
    card.innerHTML = html;
    return card;
}

function updateSpotCard(data) {
    var editBtn = document.querySelector('.settings-item[data-id="' + data.id + '"]:not(.settings-item-danger)');
    if (!editBtn) return;
    var card = editBtn.closest('.card-spot');
    if (!card) return;
    card.querySelector('.item1').textContent = data.state;
    var titleLink = card.querySelector('.card-title.item2 .card-title-link');
    if (titleLink) titleLink.textContent = data.name;
    card.querySelector('.card-body.item3').textContent = data.location;
    var link = card.querySelector('.card-body-link');
    if (link) link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.name + ', ' + data.location);

    // Swap the photo / fallback to reflect the new image_url
    var photoAnchor = card.querySelector('.card-photo, .card-photo-fallback');
    if (photoAnchor) {
        var anchor = photoAnchor.closest('a') || photoAnchor.parentNode;
        if (data.image_url) {
            anchor.innerHTML = '<img src="' + escHtml(data.image_url) + '" alt="' + escHtml(data.name) +
                '" class="card-photo" onerror="this.style.display=\'none\'">';
        } else {
            anchor.innerHTML = '<div class="card-photo-fallback">&#9968;</div>';
        }
    }

    editBtn.setAttribute('data-name', data.name);
    editBtn.setAttribute('data-city', data.city);
    editBtn.setAttribute('data-state', data.state);
    editBtn.setAttribute('data-image', data.image_url || '');
    editBtn.setAttribute('data-coords', data.coordinates || '');
}

//Submit new climbing spot
document.getElementById('submit-climbing-spot').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    const name = document.getElementById('climbing-spot-name').value;
    const city = document.getElementById('climbing-spot-city').value;
    const state = document.getElementById('climbing-spot-state').value;
    const image_url = document.getElementById('climbing-spot-image').value;
    if (name == "" || city == "" || state == "") {
        showFormError('add-spot-error', 'Name, City, and State must be filled out');
        return;
    }
    var coord = window.spotPickerAdd ? spotPickerAdd.getValue() : {};
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/api/climbing-spots', {
        method: 'POST',
        body: JSON.stringify({
            'name': name, 'city': city, 'state': state, 'image_url': image_url,
            'coordinates': coord.coordinates || null, 'coord_source': coord.coord_source || null,
            'clear_coords': coord.clear_coords || false
        }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {
                btn.disabled = false;
                btn.textContent = originalText;
                closeForm();
                document.querySelector('.cards-list').appendChild(buildSpotCard(data.spot));
                document.getElementById('search-spots').value = '';
                var total = document.querySelectorAll('.card-spot').length;
                currentPage = Math.ceil(total / PAGE_SIZE);
                renderPage();
                showNotif('Climbing spot added!');
            });
        } else {
            btn.disabled = false;
            btn.textContent = originalText;
            response.json().then(function(data) {
                showNotif(data.message || 'Could not add climbing spot', true);
            }).catch(function() {
                showNotif('Could not add climbing spot', true);
            });
        }
    })
    .catch(function() {
        btn.disabled = false;
        btn.textContent = originalText;
        showNotif('Network error', true);
    });
};

//Edit climbing spot
document.getElementById('edit-climbing-spot').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    var spot_id = btn.getAttribute("data-id");
    const name = document.getElementById('new-climbing-spot-name').value;
    const city = document.getElementById('new-climbing-spot-city').value;
    const state = document.getElementById('new-climbing-spot-state').value;
    const image_url = document.getElementById('new-climbing-spot-image').value;
    if (name == "" || city == "" || state == "") {
        showFormError('edit-spot-error', 'Name, City, and State must be filled out');
        return;
    }
    var coord = window.spotPickerEdit ? spotPickerEdit.getValue() : {};
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/api/climbing-spots/' + spot_id, {
        method: 'PATCH',
        body: JSON.stringify({
            'name': name, 'city': city, 'state': state, 'image_url': image_url,
            'coordinates': coord.coordinates || null, 'coord_source': coord.coord_source || null,
            'clear_coords': coord.clear_coords || false
        }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {
                btn.disabled = false;
                btn.textContent = originalText;
                closeForm();
                updateSpotCard(data);
                showNotif('Climbing spot updated!');
            });
        } else {
            btn.disabled = false;
            btn.textContent = originalText;
            response.json().then(function(data) {
                showNotif(data.message || 'Could not update climbing spot', true);
            }).catch(function() {
                showNotif('Could not update climbing spot', true);
            });
        }
    })
    .catch(function() {
        btn.disabled = false;
        btn.textContent = originalText;
        showNotif('Network error', true);
    });
};
