const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Generate a random session ID for this browser tab
const sessionId = Math.random().toString(36).substring(7);

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // 1. Add User Message to UI
    appendMessage(message, 'user-message');
    userInput.value = '';
    
    // 2. Show Loading
    const loadingId = appendLoading();
    scrollToBottom();

    try {
        // 3. Call Backend
        const response = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, session_id: sessionId })
        });

        const data = await response.json();

        // 4. Remove Loading
        document.getElementById(loadingId).remove();

        // 5. Display AI Text Reply
        appendMessage(data.reply, 'bot-message');

        // 6. Display Products if available
        if (data.products && data.products.length > 0) {
            appendProductCards(data.products);
        }

    } catch (error) {
        document.getElementById(loadingId).remove();
        appendMessage("Sorry, I'm having trouble connecting to the server.", 'bot-message');
        console.error(error);
    }
    
    scrollToBottom();
}

// UI Helper Functions
function appendMessage(text, className) {
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.innerText = text;
    chatBox.appendChild(div);
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot-message';
    div.innerText = 'Thinking...';
    chatBox.appendChild(div);
    return id;
}

function appendProductCards(products) {
    const container = document.createElement('div');
    container.className = 'products-container';

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="p-name">${p.name}</div>
            <div class="p-price">${p.estimated_price}</div>
            <div class="p-reason">"${p.why_recommended}"</div>
            <div class="p-platform">Available on: ${p.platform}</div>
        `;
        container.appendChild(card);
    });

    chatBox.appendChild(container);
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Allow "Enter" key to send
userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});