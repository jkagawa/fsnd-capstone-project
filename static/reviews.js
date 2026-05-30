// Ratings & reviews for the spot-detail page. Relies on showNotif/escHtml/showFormError from climb.js.
(function() {
    var section = document.getElementById('reviews-section');
    if (!section) return;
    var spotId = section.getAttribute('data-spot-id');
    var STAR = '★';

    function starsMarkup(rating) {
        var out = '';
        for (var i = 0; i < 5; i++) {
            out += i < rating ? STAR : '<span class="star-empty">' + STAR + '</span>';
        }
        return out;
    }

    function renderSummary(avg, count) {
        var html = '<span class="star-row"><span class="star-stars">' + starsMarkup(Math.round(avg)) + '</span> ';
        html += count > 0 ? '<span class="star-count">' + avg + ' (' + count + ')</span>'
                          : '<span class="star-count">No ratings yet</span>';
        return html + '</span>';
    }

    function updateSummaries(avg, count) {
        document.querySelectorAll('.js-rating-summary').forEach(function(el) {
            el.innerHTML = renderSummary(avg, count);
        });
    }

    function reviewItemInner(review, mine) {
        var html = '<div class="review-head">' +
            '<span class="review-author">' + escHtml(review.author_name) + '</span>' +
            '<span class="review-date">' + escHtml(review.created_at) + '</span></div>' +
            '<div class="review-stars star-stars">' + starsMarkup(review.rating) + '</div>';
        if (review.body) html += '<p class="review-body">' + escHtml(review.body) + '</p>';
        if (mine) {
            html += '<div class="review-actions">' +
                '<button class="review-edit-btn" data-id="' + review.id + '" data-rating="' + review.rating +
                '" data-body="' + escHtml(review.body || '') + '">Edit</button>' +
                '<button class="review-delete-btn" data-id="' + review.id + '">Delete</button></div>';
        }
        return html;
    }

    // Interactive 1-5 star picker
    function wireStarPicker(picker) {
        var buttons = picker.querySelectorAll('.star-pick');
        function paint(val) {
            buttons.forEach(function(b) {
                b.classList.toggle('star-pick-on', parseInt(b.getAttribute('data-val')) <= val);
            });
        }
        buttons.forEach(function(b) {
            b.addEventListener('mouseenter', function() { paint(parseInt(b.getAttribute('data-val'))); });
            b.addEventListener('click', function() {
                picker.setAttribute('data-value', b.getAttribute('data-val'));
                paint(parseInt(b.getAttribute('data-val')));
            });
        });
        picker.addEventListener('mouseleave', function() {
            paint(parseInt(picker.getAttribute('data-value')) || 0);
        });
        paint(parseInt(picker.getAttribute('data-value')) || 0);
    }

    // ── Add a review ──────────────────────────────────────
    var addForm = document.getElementById('review-form');
    if (addForm) {
        var addPicker = document.getElementById('review-star-picker');
        wireStarPicker(addPicker);
        document.getElementById('review-submit').addEventListener('click', function(e) {
            e.preventDefault();
            var btn = e.target;
            var rating = parseInt(addPicker.getAttribute('data-value')) || 0;
            var body = document.getElementById('review-body').value;
            if (rating < 1) { showFormError('review-error', 'Please select a star rating'); return; }
            var orig = btn.textContent;
            btn.disabled = true; btn.textContent = 'Posting...';
            fetch('/api/climbing-spots/' + spotId + '/reviews', {
                method: 'POST',
                body: JSON.stringify({ rating: rating, body: body }),
                headers: { 'Content-Type': 'application/json' }
            }).then(function(resp) {
                if (resp.ok) {
                    resp.json().then(function(data) {
                        var empty = document.getElementById('review-empty');
                        if (empty) empty.style.display = 'none';
                        var item = document.createElement('div');
                        item.className = 'review-item';
                        item.setAttribute('data-review-id', data.review.id);
                        item.innerHTML = reviewItemInner(data.review, true);
                        document.getElementById('review-list').prepend(item);
                        updateSummaries(data.rating_avg, data.rating_count);
                        addForm.remove();
                        showNotif('Review posted!');
                    });
                } else {
                    btn.disabled = false; btn.textContent = orig;
                    resp.json().then(function(d) { showNotif(d.message || 'Could not post review', true); })
                        .catch(function() { showNotif('Could not post review', true); });
                }
            }).catch(function() { btn.disabled = false; btn.textContent = orig; showNotif('Network error', true); });
        });
    }

    // ── Edit / Delete (event-delegated on the list) ───────
    document.getElementById('review-list').addEventListener('click', function(e) {
        var editBtn = e.target.closest('.review-edit-btn');
        var delBtn = e.target.closest('.review-delete-btn');
        if (editBtn) startEdit(editBtn);
        else if (delBtn) doDelete(delBtn);
    });

    function startEdit(btn) {
        var item = btn.closest('.review-item');
        var id = btn.getAttribute('data-id');
        var rating = parseInt(btn.getAttribute('data-rating')) || 0;
        var body = btn.getAttribute('data-body') || '';
        var prevHtml = item.innerHTML;
        var picks = '';
        for (var i = 1; i <= 5; i++) picks += '<button type="button" class="star-pick" data-val="' + i + '">' + STAR + '</button>';
        item.innerHTML = '<div class="star-picker" data-value="' + rating + '">' + picks + '</div>' +
            '<textarea class="review-textarea review-edit-body"></textarea>' +
            '<p class="form-error review-edit-error"></p>' +
            '<div class="review-actions">' +
            '<button class="button-submit review-save-btn">Save</button>' +
            '<button class="review-cancel-btn button-settings">Cancel</button></div>';
        item.querySelector('.review-edit-body').value = body;
        wireStarPicker(item.querySelector('.star-picker'));
        item.querySelector('.review-cancel-btn').addEventListener('click', function() {
            item.innerHTML = prevHtml;
        });
        item.querySelector('.review-save-btn').addEventListener('click', function(ev) {
            ev.preventDefault();
            var sbtn = ev.target;
            var newRating = parseInt(item.querySelector('.star-picker').getAttribute('data-value')) || 0;
            var newBody = item.querySelector('.review-edit-body').value;
            if (newRating < 1) { item.querySelector('.review-edit-error').textContent = 'Please select a star rating'; return; }
            sbtn.disabled = true; sbtn.textContent = 'Saving...';
            fetch('/api/reviews/' + id, {
                method: 'PATCH',
                body: JSON.stringify({ rating: newRating, body: newBody }),
                headers: { 'Content-Type': 'application/json' }
            }).then(function(resp) {
                if (resp.ok) {
                    resp.json().then(function(data) {
                        item.innerHTML = reviewItemInner(data.review, true);
                        updateSummaries(data.rating_avg, data.rating_count);
                        showNotif('Review updated!');
                    });
                } else {
                    sbtn.disabled = false; sbtn.textContent = 'Save';
                    showNotif('Could not update review', true);
                }
            }).catch(function() { sbtn.disabled = false; sbtn.textContent = 'Save'; showNotif('Network error', true); });
        });
    }

    function doDelete(btn) {
        if (!confirm('Delete your review?')) return;
        var id = btn.getAttribute('data-id');
        btn.disabled = true;
        fetch('/api/reviews/' + id, { method: 'DELETE' })
            .then(function(resp) {
                if (resp.ok) {
                    // Reload so the "Post Review" form reappears now that the user has no review
                    window.location.reload();
                } else {
                    btn.disabled = false;
                    showNotif('Could not delete review', true);
                }
            }).catch(function() { btn.disabled = false; showNotif('Network error', true); });
    }
})();
