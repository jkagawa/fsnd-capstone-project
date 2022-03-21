//Get URL
var url = window.location.href;

//Store access token
var access_token = ""
if(url.includes("access_token=")) {
    access_token = url.match(/\#(?:access_token)\=([\S\s]*?)\&/)[1];
}

if(access_token != "") {
    //Save access token to localStorage
    window.localStorage.setItem('access_token', access_token);
}
else {
    //Get access token to localStorage
    if(window.localStorage.getItem('access_token') != null) {
        access_token = window.localStorage.getItem('access_token');
    }
}

var JSONurl = 'https://climbing-spot.auth0.com/.well-known/jwks.json';

$.getJSON(JSONurl, function(data) {
    //Store original kid value
    var original_kid = data.keys['0']['kid'];

    //Store unverified kid value
    var unverified_kid ='';
    if (parseJwt(access_token, 0).hasOwnProperty('kid')) {
        unverified_kid = parseJwt(access_token, 0)['kid'];
    }

    if(original_kid == unverified_kid) {
        document.getElementById("button-signout").style.display = "block";
        document.getElementById("button-signin").style.display = "none";
        //console.log('Logged In');
    }
    else {
        document.getElementById("button-signout").style.display = "none";
        document.getElementById("button-signin").style.display = "block";
        //console.log('Logged Out');
    }
});

//======================================================

var post_climbingspot = false;
var patch_climbingspot = false;
var delete_climbingspot = false;
var post_climber = false;
var patch_climber = false;
var delete_climber = false;

//Check if permissions exist in JWT
if (parseJwt(access_token, 1).hasOwnProperty('permissions')) {
    var permission_array = parseJwt(access_token, 1)['permissions'];
    for(var i=0; i<permission_array.length; i++) {
        if(permission_array[i] == 'post:climbing-spot') {
            post_climbingspot = true;
        } else if(permission_array[i] == 'patch:climbing-spot') {
            patch_climbingspot = true;
        } else if(permission_array[i] == 'delete:climbing-spot') {
            delete_climbingspot = true;
        } else if(permission_array[i] == 'post:climber') {
            post_climber = true;
        } else if(permission_array[i] == 'patch:climber') {
            patch_climber = true;
        } else if(permission_array[i] == 'delete:climber') {
            delete_climber = true;
        }
    }
}


if(post_climbingspot || post_climber) {
    var ButtonAddArray = document.getElementsByClassName('button-add');
    for (var i=0; i < ButtonAddArray.length; i++){
        ButtonAddArray[i].style.display = 'block';
    }
    //console.log('Can add climbing spot');
    //console.log('Can add climber');
}
if(patch_climbingspot || patch_climber) {
    var ButtonAddArray = document.getElementsByClassName('button-edit');
    for (var i=0; i < ButtonAddArray.length; i++){
        ButtonAddArray[i].style.display = 'block';
    }
    //console.log('Can edit climbing spot');
    //console.log('Can edit climber');
}
if(delete_climbingspot || delete_climber) {
    var ButtonAddArray = document.getElementsByClassName('button-remove');
    for (var i=0; i < ButtonAddArray.length; i++){
        ButtonAddArray[i].style.display = 'block';
    }
    //console.log('Can remove climbing spot');
    //console.log('Can remove climber');
}

//Decode token to JSON
function parseJwt(token, n) {
    var result = "";
    if(token.includes(".")) {
        var base64Url = token.split('.')[n];

        var base64 = decodeURIComponent(atob(base64Url).split('').map((c)=>{
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        result = JSON.parse(base64)
    }

    return result;
}

//======================================================

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
    const location = e.getAttribute("data-location");
    var elementID = document.getElementById("edit-climbing-spot");
    elementID.setAttribute('data-id', spot_id);
    var elementName = document.getElementById("new-climbing-spot-name");
    elementName.setAttribute('value', name);
    var elementCity = document.getElementById("new-climbing-spot-city");
    var elementState = document.getElementById("new-climbing-spot-state");
    elementLocation.setAttribute('value', location);
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
    var result = confirm("Are you sure you want to remove this?");
    if (result) {
        var spot_id = e.getAttribute("data-id");
        fetch('/climbing-spots/' + spot_id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        })
        .then(function() {
            const item = e.parentElement;
            item.remove();
        });
    }
}
//Remove climber
function removeClimber(e) {
    var result = confirm("Are you sure you want to remove this?");
    if (result) {
        var climber_id = e.getAttribute("data-id");
        fetch('/climbers/' + climber_id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        })
        .then(function() {
            const item = e.parentElement;
            item.remove();
        });
    }
}
//Log user out
function signOut(source) {
    document.getElementById("button-signout").style.display = "none";
    document.getElementById("button-signin").style.display = "block";
    window.localStorage.setItem('access_token', '');
    if(source == 'spots') {
      window.location.href = "https://climbing-spot-app.herokuapp.com/climbing-spots";
    } else if(source == 'climbers') {
      window.location.href = "https://climbing-spot-app.herokuapp.com/climbers";
    }

    //console.log('JWT removed from LocalStorage');
}

//======================================================

//Submit new climbing spot
// document.getElementById('submit-climbing-spot').onclick = function(e) {
function addSpot(e) {
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
    e.preventDefault();
};

//Edit climbing spot
// document.getElementById('edit-climbing-spot').onclick = function(e) {
function editSpot(e) {
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
    e.preventDefault();
};

//Submit new climber
// document.getElementById('submit-climber').onclick = function(e) {
function addClimber(e) {
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
    e.preventDefault();
};

//Edit climber
// document.getElementById('edit-climber').onclick = function(e) {
function editClimber(e) {
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
    e.preventDefault();
};
