function showNotif(message, isError) {
    var notif = document.createElement('div');
    notif.className = 'notif-message' + (isError ? ' notif-error' : '');
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(function() { notif.remove(); }, 4000);
}

//Close all forms
function closeForm() {
    document.getElementById("AddForm").style.display = "none";
    document.getElementById("EditForm").style.display = "none";
    document.getElementById("Dimmer").style.display = "none";
}

//Open form to add new spot/climber
function openForm() {
    document.getElementById("AddForm").style.display = "block";
    document.getElementById("Dimmer").style.display = "block";
}
//Open form to edit spot
function openEditSpot(e) {
    document.getElementById("EditForm").style.display = "block";
    document.getElementById("Dimmer").style.display = "block";
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
    const climber_id = e.getAttribute("data-id");
    const name = e.getAttribute("data-name");
    const state = e.getAttribute("data-state");
    var elementID = document.getElementById("edit-climber");
    elementID.setAttribute('data-id', climber_id);
    var elementName = document.getElementById("new-climber-name");
    elementName.setAttribute('value', name);
    var elementState = document.getElementById("new-climber-state");
    elementState.setAttribute('value', state);
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
            e.parentElement.remove();
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
//Remove climber
function removeClimber(e) {
    if (!confirm("Are you sure you want to remove this?")) return;
    e.disabled = true;
    fetch('/climbers/' + e.getAttribute("data-id"), {
        method: 'DELETE'
    })
    .then(function(response) {
        if (response.ok) {
            e.parentElement.remove();
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
