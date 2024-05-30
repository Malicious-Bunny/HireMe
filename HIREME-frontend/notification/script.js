function goBack() {
    window.history.back();
}

document.querySelectorAll('.chat-notification').forEach(notification => {
    notification.addEventListener('click', function() {
        // Logic to open the chat interface
        alert('Opening chat interface...');
    });
});
