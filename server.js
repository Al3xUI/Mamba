const irc = require('irc');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        let msg = JSON.parse(message);
        console.log('Message received on server: ', msg);

        if (msg.type === 'join') {
            let nickname = msg.nickname;
            let avatar = msg.avatar;
            let client = new irc.Client('irc.freenode.net', nickname, {
                channels: ['#yourchannel'],
            });

            clients[nickname] = { ws, client, avatar };

            client.addListener('message', (from, to, text, message) => {
                console.log('IRC message: ', { from, to, text });
                broadcastMessage({ from, to, text, type: 'message', avatar: clients[from] ? clients[from].avatar : null });
            });

            client.addListener('error', (message) => {
                console.log('error: ', message);
            });
        } else if (msg.type === 'message') {
            let nickname = msg.nickname;
            let text = msg.text;
            console.log('Sending IRC message: ', { nickname, text });
            clients[nickname].client.say('#yourchannel', text);
            broadcastMessage({ from: nickname, to: '#yourchannel', text, type: 'message', avatar: clients[nickname].avatar });
        } else if (msg.type === 'typing') {
            broadcastMessage({ type: 'typing', nickname: msg.nickname });
        } else if (msg.type === 'voice') {
            broadcastMessage({ type: 'voice', audio: msg.audio, nickname: msg.nickname });
        }
    });

    ws.on('close', () => {
        // Handle user disconnection
        for (let nickname in clients) {
            if (clients[nickname].ws === ws) {
                clients[nickname].client.disconnect('User disconnected');
                delete clients[nickname];
                break;
            }
        }
    });
});

function broadcastMessage(msg) {
    for (let nickname in clients) {
        let clientWS = clients[nickname].ws;
        if (clientWS && clientWS.readyState === WebSocket.OPEN) {
            clientWS.send(JSON.stringify(msg));
        }
    }
}

server.listen(3500, () => {
    console.log('Server is listening on port 3500');
});