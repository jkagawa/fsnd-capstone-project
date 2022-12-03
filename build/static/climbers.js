//Submit new climber
document.getElementById('submit-climber').onclick = function(e) {
    e.preventDefault();
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
    }
    else {
        fetch('/climbers', {
            method: 'POST',
            body: JSON.stringify({
                'name': name,
                'state': state,
                'visited_spots': visited_spots
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

//Edit climber
document.getElementById('edit-climber').onclick = function(e) {
    e.preventDefault();
    var climber_id = e.target.getAttribute("data-id");
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
    }
    else {
        fetch('/climbers/' + climber_id, {
            method: 'PATCH',
            body: JSON.stringify({
                'name': name,
                'state': state,
                'visited_spots': visited_spots
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
