function toggleMenu() {
    document.getElementById("main_dropdown").classList.toggle("show");
    document.getElementById("container").classList.toggle("opacity_effect");
}
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn') && !event.target.matches('.menu_icon') && !event.target.matches('.dropdown-content') && !event.target.matches('.dropdown-content-head') && !event.target.matches('.closebtn')) {
        document.getElementById("main_dropdown").classList.remove('show');
        document.getElementById("container").classList.remove("opacity_effect");
    }
}

function closeNotif(){
  const els = document.querySelectorAll(".notif-message");
  for (let i = 0; i < els.length; i++) {
    els[i].style.display=" none";
  }
}
