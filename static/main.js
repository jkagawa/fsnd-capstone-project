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

// Replace a photo that failed to load with the same placeholder shown when a spot
// has no photo at all. Fires for 404s, 403s (hotlink protection), dead hosts and
// blocked requests -- anything where the browser reports a load error. Lives in
// main.js because it's referenced from every page, including home, which loads no
// per-page scripts of its own.
function imgFallback(img, className) {
    if (!img || !img.parentNode) return;
    var el = document.createElement('div');
    el.className = className;
    el.innerHTML = '&#9968;';
    img.parentNode.replaceChild(el, img);
}

function closeNotif(){
  const els = document.querySelectorAll(".notif-message");
  for (let i = 0; i < els.length; i++) {
    els[i].style.display=" none";
  }
}
