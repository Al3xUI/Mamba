let ws;

function joinChat() {
    let nickname = document.getElementById('nickname').value;
    let avatar = document.getElementById('avatar').value;
    ws = new WebSocket('ws://localhost:3500');

    ws.onopen = () => {
        console.log('WebSocket connection established');
        ws.send(JSON.stringify({ type: 'join', nickname, avatar }));
        document.getElementById('login').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    };

    ws.onmessage = (event) => {
        let msg = JSON.parse(event.data);
        console.log('Message received: ', msg);
        if (msg.type === 'message') {
            displayMessage(msg);
        }
    };
}

function sendMessage() {
    let messageInput = document.getElementById('messageInput');
    let message = messageInput.value;
    console.log('Sending message: ', message);
    ws.send(JSON.stringify({ type: 'message', text: message, nickname: document.getElementById('nickname').value }));
    messageInput.value = '';
}

function displayMessage(msg) {
    let messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (msg.avatar) {
        let avatarElement = document.createElement('img');
        avatarElement.src = msg.avatar;
        avatarElement.classList.add('avatar');
        messageElement.appendChild(avatarElement);
    }
    let nicknameElement = document.createElement('span');
    nicknameElement.classList.add('nickname');
    nicknameElement.textContent = msg.from + ': ';
    messageElement.appendChild(nicknameElement);
    let textElement = document.createElement('span');
    textElement.textContent = msg.text;
    messageElement.appendChild(textElement);
    document.getElementById('messages').appendChild(messageElement);
    // Scroll to the bottom of the messages div
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}