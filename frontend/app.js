document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').onclick = sendMessage;
    document.getElementById('user-input').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    loadHistory();
});

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    appendMsg('user', text);
    input.value = '';
    
    const typingId = 'typing-' + Date.now();
    appendMsg('assistant', 'Analyzing prices and availability...', [], typingId);

    try {
        const res = await fetch(`/chat?msg=${encodeURIComponent(text)}`, { method: 'POST' });
        const data = await res.json();
        
        document.getElementById(typingId).remove();

        // FIX: Defensive checks for 'reply' keys
        const aiReply = data.reply || data.response || "Here are some recommendations:";
        const products = data.products || [];

        appendMsg('assistant', aiReply, products);
        loadHistory();
    } catch (err) {
        document.getElementById(typingId).innerText = "Server Error. Check your Groq API Key.";
    }
}

function appendMsg(role, text, products = [], id = null) {
    const win = document.getElementById('chat-window');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.style.display = 'none';

    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    if(id) div.id = id;

    let html = `<p>${text}</p>`;
    
    if (products.length > 0) {
        html += `<div class="product-grid">`;
        products.forEach(p => {
            // REDIRECTION: Creates a clickable search link
            const url = p.url || `https://www.google.com/search?q=${encodeURIComponent(p.name)}+${p.platform}`;
            html += `
                <div class="product-card" onclick="window.open('${url}', '_blank')">
                    <strong>${p.name}</strong>
                    <span class="price-tag">${p.price_range || 'Check Price'}</span>
                    <small style="color:#10b981">${p.platform}</small>
                    <small class="click-hint">Click to View Product →</small>
                </div>`;
        });
        html += `</div>`;
    }

    div.innerHTML = html;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

async function loadHistory() {
    const res = await fetch('/history');
    const history = await res.json();
    const list = document.getElementById('history-list');
    list.innerHTML = history.slice(-6).reverse().map(h => `<div class="history-item">${h.message}</div>`).join('');
}
