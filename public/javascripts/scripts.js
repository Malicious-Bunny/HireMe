function filterNotifications(type) {
    var notifications = document.querySelectorAll('.notification');
    notifications.forEach(function(notification) {
        if (type === 'all' || notification.classList.contains(type)) {
            notification.style.display = 'flex';
        } else {
            notification.style.display = 'none';
        }
    });
}

function markAsRead(element) {
    element.parentElement.style.opacity = '0.6';
}

function viewDetails(element) {
    var modal = document.getElementById('details-modal');
    var content = document.getElementById('details-content');
    content.textContent = element.parentElement.querySelector('p').textContent;
    modal.style.display = 'block';
}

function closeModal() {
    var modal = document.getElementById('details-modal');
    modal.style.display = 'none';
}

function dismissNotification(element) {
    element.parentElement.style.display = 'none';
}

function openChat(element) {
    window.location.href = 'chat.html'; // Navigate to the chat interface page
}

// Close modals when clicking outside of them
window.onclick = function(event) {
    var detailsModal = document.getElementById('details-modal');
    if (event.target === detailsModal) {
        detailsModal.style.display = 'none';
    }
}
