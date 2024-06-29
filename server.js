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
                let clientWS = clients[from]?.ws;
                if (clientWS && clientWS.readyState === WebSocket.OPEN) {
                    clientWS.send(JSON.stringify({ from, to, text, type: 'message', avatar: clients[from] ? clients[from].avatar : null }));
                }
            });

            client.addListener('error', (message) => {
                console.log('error: ', message);
            });
        } else if (msg.type === 'message') {
            let nickname = msg.nickname;
            let text = msg.text;
            console.log('Sending IRC message: ', { nickname, text });
            clients[nickname].client.say('#yourchannel', text);
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

server.listen(3500, () => {
    console.log('Server is listening on port 3500');
});