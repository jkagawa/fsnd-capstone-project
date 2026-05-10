document.getElementById('search-spots').addEventListener('input', function() {
    var query = this.value.toLowerCase();
    var cards = document.querySelectorAll('.card-spot');
    var visible = 0;
    cards.forEach(function(card) {
        var text = [
            card.querySelector('.card-title.item2'),
            card.querySelector('.card-body.item3'),
            card.querySelector('.item1')
        ].map(function(el) { return el ? el.textContent : ''; }).join(' ').toLowerCase();
        var show = text.includes(query);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    document.getElementById('search-no-results').style.display = visible === 0 && query ? 'block' : 'none';
});

function buildSpotCard(spot) {
    var canEdit = USER_PERMISSIONS && USER_PERMISSIONS.includes('patch:climbing-spot');
    var canDelete = USER_PERMISSIONS && USER_PERMISSIONS.includes('delete:climbing-spot');
    var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(spot.name + ', ' + spot.location);
    var html = '<div class="grid-container">' +
        '<div class="item1">' + escHtml(spot.address_state) + '</div>' +
        '<div class="card-title item2">' + escHtml(spot.name) + '</div>' +
        '<div class="card-body item3">' + escHtml(spot.location) + '</div>' +
        '<div class="card-body item4"><a href="' + mapsUrl + '" target="_blank" class="card-body-link">Open in Google Maps &rarr;</a></div>' +
        '<div class="card-body item5">Added by You</div>' +
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
                ' onclick="openEditSpot(this)">Edit Spot</button>';
        }
        if (canDelete) {
            html += '<button class="settings-item settings-item-danger"' +
                ' data-id="' + spot.id + '"' +
                ' onclick="removeSpot(this)">Delete Spot</button>';
        }
        html += '</div></div>';
    }
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
    card.querySelector('.card-title.item2').textContent = data.name;
    card.querySelector('.card-body.item3').textContent = data.location;
    var link = card.querySelector('.card-body-link');
    if (link) link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.name + ', ' + data.location);
    editBtn.setAttribute('data-name', data.name);
    editBtn.setAttribute('data-city', data.city);
    editBtn.setAttribute('data-state', data.state);
}

//Submit new climbing spot
document.getElementById('submit-climbing-spot').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    const name = document.getElementById('climbing-spot-name').value;
    const city = document.getElementById('climbing-spot-city').value;
    const state = document.getElementById('climbing-spot-state').value;
    if (name == "" || city == "" || state == "") {
        showFormError('add-spot-error', 'Name, City, and State must be filled out');
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/api/climbing-spots', {
        method: 'POST',
        body: JSON.stringify({ 'name': name, 'city': city, 'state': state }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {
                btn.disabled = false;
                btn.textContent = originalText;
                closeForm();
                document.querySelector('.cards-list').appendChild(buildSpotCard(data.spot));
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
    if (name == "" || city == "" || state == "") {
        showFormError('edit-spot-error', 'Name, City, and State must be filled out');
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/api/climbing-spots/' + spot_id, {
        method: 'PATCH',
        body: JSON.stringify({ 'name': name, 'city': city, 'state': state }),
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
