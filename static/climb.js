function showNotif(message, isError) {
    var notif = document.createElement('div');
    notif.className = 'notif-message' + (isError ? ' notif-error' : '');
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(function() { notif.remove(); }, 10000);
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showFormError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg;
}

//Close all forms
function closeForm() {
    document.getElementById("AddForm").style.display = "none";
    document.getElementById("EditForm").style.display = "none";
    document.getElementById("Dimmer").style.display = "none";
    document.querySelectorAll('.form-error').forEach(function(el) { el.textContent = ''; });
    document.body.style.overflow = '';
}

//Open form to add new spot/climber
function openForm() {
    document.getElementById("AddForm").style.display = "block";
    document.getElementById("Dimmer").style.display = "block";
    document.body.style.overflow = 'hidden';
}
//Open form to edit spot
function openEditSpot(e) {
    document.getElementById("EditForm").style.display = "block";
    document.getElementById("Dimmer").style.display = "block";
    document.body.style.overflow = 'hidden';
    const spot_id = e.getAttribute("data-id");
    const name = e.getAttribute("data-name");
    const city = e.getAttribute("data-city");
    const state = e.getAttribute("data-state");
    document.getElementById("edit-climbing-spot").setAttribute('data-id', spot_id);
    document.getElementById("new-climbing-spot-name").setAttribute('value', name);
    document.getElementById("new-climbing-spot-city").setAttribute('value', city);
    document.getElementById("new-climbing-spot-state").setAttribute('value', state);
}
//Open form to edit climber
function openEditClimber(e) {
    document.getElementById("EditForm").style.display = "block";
    document.getElementById("Dimmer").style.display = "block";
    document.body.style.overflow = 'hidden';
    const climber_id = e.getAttribute("data-id");
    const name = e.getAttribute("data-name");
    const state = e.getAttribute("data-state");
    var elementID = document.getElementById("edit-climber");
    elementID.setAttribute('data-id', climber_id);
    var elementName = document.getElementById("new-climber-name");
    elementName.setAttribute('value', name);
    var elementState = document.getElementById("new-climber-state");
    elementState.setAttribute('value', state);
    var visitedIds = JSON.parse(e.getAttribute("data-visited-ids") || "[]");
    document.querySelectorAll('#EditForm .list-spot input').forEach(function(cb) {
        cb.checked = visitedIds.indexOf(parseInt(cb.getAttribute("data-id"))) !== -1;
    });
}
//Remove spot
function removeSpot(e) {
    if (!confirm("Are you sure you want to remove this?")) return;
    e.disabled = true;
    fetch('/climbing-spots/' + e.getAttribute("data-id"), {
        method: 'DELETE'
    })
    .then(function(response) {
        if (response.ok) {
            e.closest('.card-spot').remove();
            showNotif('Climbing spot removed');
        } else {
            e.disabled = false;
            response.json().then(function(data) {
                showNotif(data.message || 'Could not remove spot', true);
            }).catch(function() {
                showNotif('Could not remove spot', true);
            });
        }
    })
    .catch(function() {
        e.disabled = false;
        showNotif('Network error', true);
    });
}
function toggleSettings(btn) {
    var menu = btn.nextElementSibling;
    var isOpen = menu.style.display === 'block';
    document.querySelectorAll('.settings-menu').forEach(function(m) { m.style.display = 'none'; });
    if (!isOpen) menu.style.display = 'block';
}
document.addEventListener('click', function(e) {
    if (!e.target.closest('.card-settings-wrap')) {
        document.querySelectorAll('.settings-menu').forEach(function(m) { m.style.display = 'none'; });
    }
});
//Remove climber
function removeClimber(e) {
    if (!confirm("Are you sure you want to remove this?")) return;
    e.disabled = true;
    fetch('/climbers/' + e.getAttribute("data-id"), {
        method: 'DELETE'
    })
    .then(function(response) {
        if (response.ok) {
            e.closest('.card-climber').remove();
            showNotif('Climber profile removed');
        } else {
            e.disabled = false;
            response.json().then(function(data) {
                showNotif(data.message || 'Could not remove climber', true);
            }).catch(function() {
                showNotif('Could not remove climber', true);
            });
        }
    })
    .catch(function() {
        e.disabled = false;
        showNotif('Network error', true);
    });
}
