var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

var roomsInfo = new Map();

io.on("connection", function (socket) {
  socket.on("join_room", (room) => {
    if (!roomsInfo.has(room)) {
      roomsInfo.set(room, []);
    }
    socket.join(room);
  });

  socket.on("circleSelected", function (data) {
    const { id, name, score, typePicked, isWinner, room } = data;
    roomsInfo.get(room).push(data);
    io.sockets.to(room).emit("circleTypeSelected", roomsInfo.get(room));
  });

  socket.on("playAgain", function (room) {
    roomsInfo.set(room, []);
  });
});

server.listen(8080, function () {
  console.log("Servidor corriendo en http://localhost:8080");
});