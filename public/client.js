let ws;
let mediaRecorder;
let audioChunks = [];

function joinChat() {
    let nickname = document.getElementById('nickname').value;
    let avatarInput = document.getElementById('avatarInput');
    
    if (avatarInput.files.length > 0) {
        let reader = new FileReader();
        reader.onload = function(e) {
            let avatar = e.target.result;
            document.cookie = `nickname=${nickname}; secure; SameSite=Strict; path=/`;
            document.cookie = `avatar=${encodeURIComponent(avatar)}; secure; SameSite=Strict; path=/`;
            connectToWebSocket(nickname, avatar);
        };
        reader.readAsDataURL(avatarInput.files[0]);
    } else {
        let avatar = getCookie('avatar') || '';
        document.cookie = `nickname=${nickname}; secure; SameSite=Strict; path=/`;
        connectToWebSocket(nickname, avatar);
    }
}

function connectToWebSocket(nickname, avatar) {
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
        } else if (msg.type === 'typing') {
            displayTypingIndicator(msg);
        } else if (msg.type === 'voice') {
            playVoiceMessage(msg);
        }
    };

    document.getElementById('messageInput').addEventListener('input', () => {
        ws.send(JSON.stringify({ type: 'typing', nickname }));
    });

    document.getElementById('voiceMessageButton').addEventListener('mousedown', startRecording);
    document.getElementById('voiceMessageButton').addEventListener('mouseup', stopRecording);
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
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function displayTypingIndicator(msg) {
    let typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.textContent = `${msg.nickname} is typing...`;
    clearTimeout(typingIndicator.timeout);
    typingIndicator.timeout = setTimeout(() => {
        typingIndicator.textContent = '';
    }, 1000);
}

function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if (name == cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                let reader = new FileReader();
                reader.onload = function(e) {
                    let base64AudioMessage = e.target.result;
                    ws.send(JSON.stringify({ type: 'voice', audio: base64AudioMessage, nickname: document.getElementById('nickname').value }));
                };
                reader.readAsDataURL(audioBlob);
            };
            mediaRecorder.start();
        });
}

function stopRecording() {
    mediaRecorder.stop();
}

function playVoiceMessage(msg) {
    let audio = new Audio(msg.audio);
    audio.play();
}