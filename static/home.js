// Home page motion: scroll-triggered reveals and the stat count-up.
//
// Progressive enhancement is the rule here. The .reveal elements are only hidden
// once this file has run and tagged <html> with .has-reveal, so if the script never
// loads, IntersectionObserver is missing, or anything throws, the page renders as
// plain static content rather than a blank scroll.
//
// Note: main.js assigns window.onclick directly, so everything here uses
// addEventListener -- assigning window.onclick would silently kill the nav menu.

(function homeMotion() {
    var root = document.documentElement;
    var supportsObserver = 'IntersectionObserver' in window;
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var revealEls = document.querySelectorAll('.reveal');
    var statEls = document.querySelectorAll('.home-stat-num');

    // Server-rendered values are the source of truth; capture them before the
    // count-up ever writes over them so a failure can always restore the real number.
    var stats = [];
    for (var i = 0; i < statEls.length; i++) {
        var text = statEls[i].textContent.trim();
        var target = parseInt(text, 10);
        stats.push({ el: statEls[i], text: text, target: isNaN(target) ? null : target });
    }

    function showAllStats() {
        stats.forEach(function(s) { s.el.textContent = s.text; });
    }

    function countUp(stat) {
        if (stat.target === null) return;      // non-numeric, leave it alone
        var duration = 900;
        var start = null;
        stat.el.textContent = '0';
        function step(now) {
            if (start === null) start = now;
            var p = Math.min((now - start) / duration, 1);
            // Ease-out so it decelerates into the final value.
            var eased = 1 - Math.pow(1 - p, 3);
            stat.el.textContent = Math.round(stat.target * eased);
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                stat.el.textContent = stat.text;   // land on the exact rendered value
            }
        }
        requestAnimationFrame(step);
    }

    // Reduced motion or no observer support: show everything immediately, animate nothing.
    if (reduceMotion || !supportsObserver) {
        showAllStats();
        return;
    }

    // Only now is it safe for CSS to hide .reveal elements.
    root.classList.add('has-reveal');

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);      // reveal once, don't re-run on scroll back
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    for (var j = 0; j < revealEls.length; j++) {
        observer.observe(revealEls[j]);
    }

    // The stats live in the hero, which is on screen at load, so they get their own
    // observer rather than a .reveal class -- the count should start when seen, not
    // compete with the hero's entrance stagger.
    if (stats.length) {
        var statsWrap = document.querySelector('.home-stats');
        if (statsWrap) {
            var statObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    stats.forEach(countUp);
                    statObserver.unobserve(entry.target);
                });
            }, { threshold: 0.5 });
            statObserver.observe(statsWrap);
        }
    }
})();
