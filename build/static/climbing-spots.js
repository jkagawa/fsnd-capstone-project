//Submit new climbing spot
document.getElementById('submit-climbing-spot').onclick = function(e) {
    e.preventDefault();
    const name = document.getElementById('climbing-spot-name').value;
    const city = document.getElementById('climbing-spot-city').value;
    const state = document.getElementById('climbing-spot-state').value;
    if (name == "" || city == "" || state == "") {
        alert("Name, City, and State must be filled out");
    } else if (state.length !== 2) {
        alert("State must be 2 characters");
    } else {
        fetch('/climbing-spots', {
            method: 'POST',
            body: JSON.stringify({
                'name': name,
                'city': city,
                'state': state
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token
            }
        })
        .then(function() {
            closeForm()
            window.location.reload();
        });
    }
};

//Edit climbing spot
document.getElementById('edit-climbing-spot').onclick = function(e) {
    e.preventDefault();
    var spot_id = e.target.getAttribute("data-id");
    const name = document.getElementById('new-climbing-spot-name').value;
    const city = document.getElementById('new-climbing-spot-city').value;
    const state = document.getElementById('new-climbing-spot-state').value;
    if (name == "" || city == "" || state == "") {
        alert("Name, City, and State must be filled out");
    } else if (state.length !== 2) {
        alert("State must be 2 characters");
    } else {
        fetch('/climbing-spots/' + spot_id, {
            method: 'PATCH',
            body: JSON.stringify({
                'name': name,
                'city': city,
                'state': state
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token
            }
        })
        .then(function() {
            closeForm()
            window.location.reload();
        });
    }
};
