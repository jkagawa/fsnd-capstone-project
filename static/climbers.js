//Submit new climber
document.getElementById('submit-climber').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    const name = document.getElementById('climber-name').value;
    const state = document.getElementById('climber-state').value;

    var visited_spots = [];
    var CheckBoxArray = document.querySelectorAll('.list-spot input');
    for (var i=0; i < CheckBoxArray.length; i++){
        if (CheckBoxArray[i].checked == true) {
            visited_spots.push(parseInt(CheckBoxArray[i].getAttribute("data-id")));
        }
    }

    if (name == "" || state == "") {
        alert("Name and State must be filled out");
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/climbers', {
        method: 'POST',
        body: JSON.stringify({
            'name': name,
            'state': state,
            'visited_spots': visited_spots
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        if (response.ok) {
            closeForm();
            window.location.reload();
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
    var CheckBoxArray = document.querySelectorAll('.list-spot input');
    for (var i=0; i < CheckBoxArray.length; i++){
        if (CheckBoxArray[i].checked == true) {
            visited_spots.push(parseInt(CheckBoxArray[i].getAttribute("data-id")));
        }
    }

    if (name == "" || state == "") {
        alert("Name and State must be filled out");
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/climbers/' + climber_id, {
        method: 'PATCH',
        body: JSON.stringify({
            'name': name,
            'state': state,
            'visited_spots': visited_spots
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        if (response.ok) {
            closeForm();
            window.location.reload();
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
