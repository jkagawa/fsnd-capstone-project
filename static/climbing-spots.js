//Submit new climbing spot
document.getElementById('submit-climbing-spot').onclick = function(e) {
    e.preventDefault();
    var btn = e.target;
    const name = document.getElementById('climbing-spot-name').value;
    const city = document.getElementById('climbing-spot-city').value;
    const state = document.getElementById('climbing-spot-state').value;
    if (name == "" || city == "" || state == "") {
        alert("Name, City, and State must be filled out");
        return;
    }
    if (state.length !== 2) {
        alert("State must be 2 characters");
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/climbing-spots', {
        method: 'POST',
        body: JSON.stringify({ 'name': name, 'city': city, 'state': state }),
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
        alert("Name, City, and State must be filled out");
        return;
    }
    if (state.length !== 2) {
        alert("State must be 2 characters");
        return;
    }
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    fetch('/climbing-spots/' + spot_id, {
        method: 'PATCH',
        body: JSON.stringify({ 'name': name, 'city': city, 'state': state }),
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
