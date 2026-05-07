document.getElementById('search-climbers').addEventListener('input', function() {
    var query = this.value.toLowerCase();
    var cards = document.querySelectorAll('.card-climber');
    var visible = 0;
    cards.forEach(function(card) {
        var text = [
            card.querySelector('.card-title'),
            card.querySelector('.card-info')
        ].map(function(el) { return el ? el.textContent : ''; }).join(' ').toLowerCase();
        var show = text.includes(query);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    document.getElementById('search-no-results').style.display = visible === 0 && query ? 'block' : 'none';
});

function buildClimberCard(climber) {
    var canEdit = USER_PERMISSIONS && USER_PERMISSIONS.includes('patch:climber');
    var canDelete = USER_PERMISSIONS && USER_PERMISSIONS.includes('delete:climber');
    var visitedIdsJson = escHtml(JSON.stringify(climber.visited_spot_ids || []));
    var html = '';
    if (canDelete) {
        html += '<button type="submit" class="button-remove" data-id="' + climber.id + '" onclick="removeClimber(this)"><b>Remove</b></button>';
    }
    if (canEdit) {
        html += '<button type="submit" class="button-edit" data-id="' + climber.id + '" data-name="' + escHtml(climber.name) + '" data-state="' + escHtml(climber.state) + '" data-visited-ids="' + visitedIdsJson + '" onclick="openEditClimber(this)"><b>Edit</b></button>';
    }
    html += '<div class="card-title">' + escHtml(climber.name) + '</div>' +
        '<div class="card-info">' + escHtml(climber.state) + '</div>' +
        '<div class="card-body"><i class="fa fa-star" style="vertical-align:middle; margin-right: 4px;"></i>' +
        '<span style="vertical-align:middle;">' + climber.visited_count + ' saved spots</span></div>';
    var card = document.createElement('div');
    card.className = 'card-climber';
    card.setAttribute('data-added-by', climber.added_by || '');
    card.innerHTML = html;
    return card;
}

function updateClimberCard(data) {
    var editBtn = document.querySelector('.button-edit[data-id="' + data.id + '"]');
    if (!editBtn) return;
    var card = editBtn.parentElement;
    card.querySelector('.card-title').textContent = data.name;
    card.querySelector('.card-info').textContent = data.state;
    card.querySelector('.card-body span').textContent = data.visited_count + ' saved spots';
    editBtn.setAttribute('data-name', data.name);
    editBtn.setAttribute('data-state', data.state);
    editBtn.setAttribute('data-visited-ids', JSON.stringify(data.visited_spot_ids || []));
}

//Submit new climber
document.getElementById('submit-climber').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    const name = document.getElementById('climber-name').value;
    const state = document.getElementById('climber-state').value;

    var visited_spots = [];
    var CheckBoxArray = document.querySelectorAll('#AddForm .list-spot input');
    for (var i=0; i < CheckBoxArray.length; i++){
        if (CheckBoxArray[i].checked == true) {
            visited_spots.push(parseInt(CheckBoxArray[i].getAttribute("data-id")));
        }
    }

    if (name == "" || state == "") {
        showFormError('add-climber-error', 'Name and State must be filled out');
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/api/climbers', {
        method: 'POST',
        body: JSON.stringify({ 'name': name, 'state': state, 'visited_spots': visited_spots }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {
                closeForm();
                document.querySelector('.cards-list').appendChild(buildClimberCard(data.climber));
                showNotif('Climber profile created!');
            });
        } else {
            btn.disabled = false;
            btn.textContent = originalText;
            response.json().then(function(data) {
                showNotif(data.message || 'Could not create climber profile', true);
            }).catch(function() {
                showNotif('Could not create climber profile', true);
            });
        }
    })
    .catch(function() {
        btn.disabled = false;
        btn.textContent = originalText;
        showNotif('Network error', true);
    });
};

//Edit climber
document.getElementById('edit-climber').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    var climber_id = btn.getAttribute("data-id");
    const name = document.getElementById('new-climber-name').value;
    const state = document.getElementById('new-climber-state').value;

    var visited_spots = [];
    var CheckBoxArray = document.querySelectorAll('#EditForm .list-spot input');
    for (var i=0; i < CheckBoxArray.length; i++){
        if (CheckBoxArray[i].checked == true) {
            visited_spots.push(parseInt(CheckBoxArray[i].getAttribute("data-id")));
        }
    }

    if (name == "" || state == "") {
        showFormError('edit-climber-error', 'Name and State must be filled out');
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/api/climbers/' + climber_id, {
        method: 'PATCH',
        body: JSON.stringify({ 'name': name, 'state': state, 'visited_spots': visited_spots }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {
                closeForm();
                updateClimberCard(data);
                showNotif('Climber profile updated!');
            });
        } else {
            btn.disabled = false;
            btn.textContent = originalText;
            response.json().then(function(data) {
                showNotif(data.message || 'Could not update climber profile', true);
            }).catch(function() {
                showNotif('Could not update climber profile', true);
            });
        }
    })
    .catch(function() {
        btn.disabled = false;
        btn.textContent = originalText;
        showNotif('Network error', true);
    });
};
