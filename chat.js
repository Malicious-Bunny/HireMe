function goBack() {
    window.history.back();
}

document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message === '') return;

    const chatMessages = document.getElementById('chat-messages');

    const userMessage = document.createElement('div');
    userMessage.classList.add('chat-message', 'user');
    userMessage.innerHTML = `<p>${message}</p>`;

    chatMessages.appendChild(userMessage);
    messageInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate receiving a message
    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.classList.add('chat-message', 'bot');
        botMessage.innerHTML = `<p>Received: ${message}</p>`;
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}
