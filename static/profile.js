function updateProfileDisplay(data) {
    document.querySelector('.profile-name').textContent = data.name;
    document.querySelector('.profile-state').textContent = data.state;
    var countEl = document.querySelector('.profile-spots-count span');
    if (countEl) {
        var n = data.visited_count || 0;
        countEl.textContent = n + ' saved spot' + (n !== 1 ? 's' : '');
    }
    var list = document.querySelector('.profile-visited-list');
    if (list) {
        list.innerHTML = '';
        (data.visited_spot_names || []).forEach(function(name) {
            var li = document.createElement('li');
            li.textContent = name;
            list.appendChild(li);
        });
    } else if (data.visited_spot_names && data.visited_spot_names.length > 0) {
        var newList = document.createElement('ul');
        newList.className = 'profile-visited-list';
        data.visited_spot_names.forEach(function(name) {
            var li = document.createElement('li');
            li.textContent = name;
            newList.appendChild(li);
        });
        var countEl2 = document.querySelector('.profile-spots-count');
        if (countEl2) countEl2.after(newList);
    }
    var editBtn = document.querySelector('.profile-actions [data-id]');
    if (editBtn) {
        editBtn.setAttribute('data-name', data.name);
        editBtn.setAttribute('data-state', data.state);
        editBtn.setAttribute('data-visited-ids', JSON.stringify(data.visited_spot_ids || []));
    }
}

function deleteProfile(climber_id) {
    if (!confirm('Delete your climber profile? This cannot be undone.')) return;
    fetch('/api/climbers/' + climber_id, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            window.location.reload();
        } else {
            response.json().then(function(data) {
                showNotif(data.message || 'Could not delete profile', true);
            }).catch(function() {
                showNotif('Could not delete profile', true);
            });
        }
    })
    .catch(function() {
        showNotif('Network error', true);
    });
}

var submitClimberBtn = document.getElementById('submit-climber');
if (submitClimberBtn) {
    submitClimberBtn.onclick = function(e) {
        e.preventDefault();
        var btn = e.target;
        var name = document.getElementById('climber-name').value;
        var state = document.getElementById('climber-state').value;
        var visited_spots = [];
        document.querySelectorAll('#AddForm .list-spot input').forEach(function(cb) {
            if (cb.checked) visited_spots.push(parseInt(cb.getAttribute('data-id')));
        });
        if (name === '' || state === '') {
            showFormError('add-climber-error', 'Name and State must be filled out');
            return;
        }
        var originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Submitting...';
        fetch('/api/climbers', {
            method: 'POST',
            body: JSON.stringify({ name: name, state: state, visited_spots: visited_spots }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(function(response) {
            if (response.ok) {
                window.location.reload();
            } else {
                btn.disabled = false;
                btn.textContent = originalText;
                response.json().then(function(data) {
                    showNotif(data.message || 'Could not create profile', true);
                }).catch(function() {
                    showNotif('Could not create profile', true);
                });
            }
        })
        .catch(function() {
            btn.disabled = false;
            btn.textContent = originalText;
            showNotif('Network error', true);
        });
    };
}

var editClimberBtn = document.getElementById('edit-climber');
if (editClimberBtn) {
    editClimberBtn.onclick = function(e) {
        e.preventDefault();
        var btn = e.target;
        var climber_id = btn.getAttribute('data-id');
        var name = document.getElementById('new-climber-name').value;
        var state = document.getElementById('new-climber-state').value;
        var visited_spots = [];
        document.querySelectorAll('#EditForm .list-spot input').forEach(function(cb) {
            if (cb.checked) visited_spots.push(parseInt(cb.getAttribute('data-id')));
        });
        if (name === '' || state === '') {
            showFormError('edit-climber-error', 'Name and State must be filled out');
            return;
        }
        var originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Submitting...';
        fetch('/api/climbers/' + climber_id, {
            method: 'PATCH',
            body: JSON.stringify({ name: name, state: state, visited_spots: visited_spots }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(function(response) {
            if (response.ok) {
                response.json().then(function(data) {
                    btn.disabled = false;
                    btn.textContent = originalText;
                    closeForm();
                    window.location.reload();
                });
            } else {
                btn.disabled = false;
                btn.textContent = originalText;
                response.json().then(function(data) {
                    showNotif(data.message || 'Could not update profile', true);
                }).catch(function() {
                    showNotif('Could not update profile', true);
                });
            }
        })
        .catch(function() {
            btn.disabled = false;
            btn.textContent = originalText;
            showNotif('Network error', true);
        });
    };
}
