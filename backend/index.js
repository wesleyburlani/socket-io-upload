const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const uploadRouter = require('./upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    },
    transports: [ "websocket" ],
    maxHttpBufferSize: 1e8 // 100 MB 
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  uploadRouter(socket);
});
  
server.listen(4000, () => {
  console.log('listening on *:4000');
});