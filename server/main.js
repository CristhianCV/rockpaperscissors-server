var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

var roomsInfo = new Map();
const types = { ROCK: "rock", SCISSOR: "scissors", PAPER: "paper" };

function showOnConsola(message) {
  console.log(message);
}

io.on("connection", function (socket) {
  socket.on("joinRoom", (data) => {
    const { id, name, score, typePicked, isWinner, room } = data;

    if (!roomsInfo.has(room)) {
      roomsInfo.set(room, []);
    }

    if (roomsInfo.get(room).length === 2) {
      socket.emit("joinRoomResponse", {
        code: "ERROR",
        message: "The number of players was excedded",
      });
    } else {
      roomsInfo.get(room).push(data);
      socket.join(room);

      socket.emit("joinRoomResponse", {
        code: "OK",
        message: "Connected Succesfully",
      });

      if (roomsInfo.get(room).length === 2) {
        io.sockets.to(room).emit("gameReady", {
          code: "OK",
          message: "The game is ready to start",
        });
      }
    }
  });

  socket.on("circleSelected", function (data) {
    const { id, name, score, typePicked, isWinner, room } = data;

    roomsInfo.get(room).forEach((player) => {
      if (player.id === id) {
        player.typePicked = typePicked;
      }
    });

    let playerOneSelectedType = roomsInfo.get(room)[0].typePicked;
    let playerTwoSelectedType = roomsInfo.get(room)[1].typePicked;

    if (
      playerOneSelectedType.trim() !== "" &&
      playerTwoSelectedType.trim() !== ""
    ) {
      let winner = getWinner(playerOneSelectedType, playerTwoSelectedType);
      if (winner) {
        roomsInfo.get(room)[winner - 1].isWinner = true;
        roomsInfo.get(room)[winner - 1].score += 1;
      }
      io.sockets.to(room).emit("circleSelectedResponse", {
        idWinner: winner ? roomsInfo.get(room)[winner - 1].id : 0,
        players: roomsInfo.get(room),
      });
    }
  });

  socket.on("playAgain", function (data) {
    const { id, name, score, typePicked, isWinner, room } = data;

    roomsInfo.get(room).forEach((player) => {
      player.typePicked = "";
      player.isWinner = false;
    });
  });

  socket.on("exitGame", (data) => {
    const { id, name, score, typePicked, isWinner, room } = data;

    let count = 0;
    let index = 0;

    if (roomsInfo.has(room) && roomsInfo.get(room).length > 0) {
      roomsInfo.get(room).forEach((player) => {
        if (player.id === id) {
          index = count;
        }
        count++;
      });
      roomsInfo.get(room).splice(index, 1);
    }
  });
});

const getWinner = (playerOneSelectedType, playerTwoSelectedType) => {
  let playerWinner = 0;
  switch (playerOneSelectedType) {
    case types.ROCK:
      switch (playerTwoSelectedType) {
        case types.ROCK:
          playerWinner = 0;
          break;
        case types.PAPER:
          playerWinner = 2;
          break;
        case types.SCISSOR:
          playerWinner = 1;
          break;
        default:
          break;
      }
      break;
    case types.PAPER:
      switch (playerTwoSelectedType) {
        case types.ROCK:
          playerWinner = 1;
          break;
        case types.PAPER:
          playerWinner = 0;
          break;
        case types.SCISSOR:
          playerWinner = 2;
          break;
        default:
          break;
      }
      break;
    case types.SCISSOR:
      switch (playerTwoSelectedType) {
        case types.ROCK:
          playerWinner = 2;
          break;
        case types.PAPER:
          playerWinner = 1;
          break;
        case types.SCISSOR:
          playerWinner = 0;
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  return playerWinner;
};

server.listen(8080, function () {
  console.log("Servidor corriendo en http://localhost:8080");
});
