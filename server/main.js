var express = require("express");
var cors = require("cors");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

app.use(cors());

var roomsInfo = new Map();
const types = { ROCK: "rock", SCISSOR: "scissors", PAPER: "paper" };

function showOnConsola(message) {
  console.log(message);
}

io.on("connection", function (socket) {
  socket.on("joinRoom", (data) => {
    const { id, name, score, typePicked, isWinner, room } = data;

    if (!roomsInfo.has(room)) {
      roomsInfo.set(room, new Map());
    }

    if (roomsInfo.get(room).size === 2) {
      socket.emit("joinRoomResponse", {
        code: "ERROR",
        message: "The number of players was excedded",
      });
      showOnConsola("error");
    } else {
      roomsInfo.get(room).set(id, data);
      socket.join(room);

      socket.emit("joinRoomResponse", {
        code: "OK",
        message: "Connected Succesfully",
      });
      showOnConsola("connected" + id);

      if (roomsInfo.get(room).size === 2) {
        io.sockets.to(room).emit("gameReady", {
          code: "OK",
          message: "The game is ready to start",
        });
        showOnConsola("ready");
      }
    }
  });

  socket.on("circleSelected", function (data) {
    const { id, name, score, typePicked, isWinner, room } = data;

    roomsInfo.get(room).get(id).typePicked = typePicked;

    let idPlayers = Array.from(roomsInfo.get(room).keys());

    let playerOneSelectedType = roomsInfo.get(room).get(idPlayers[0])
      .typePicked;
    let playerTwoSelectedType = roomsInfo.get(room).get(idPlayers[1])
      .typePicked;

    if (
      playerOneSelectedType.trim() !== "" &&
      playerTwoSelectedType.trim() !== ""
    ) {
      let winnerIndex = getWinner(playerOneSelectedType, playerTwoSelectedType);
      showOnConsola("winnerIndex" + winnerIndex);
      if (winnerIndex) {
        roomsInfo.get(room).get(idPlayers[winnerIndex - 1]).isWinner = true;
        roomsInfo.get(room).get(idPlayers[winnerIndex - 1]).score += 1;
      }
      io.sockets.to(room).emit("circleSelectedResponse", {
        idWinner: winnerIndex
          ? roomsInfo.get(room).get(idPlayers[winnerIndex - 1]).id
          : 0,
        players: Array.from(roomsInfo.get(room).values()),
      });
      showOnConsola(Array.from(roomsInfo.get(room).values()));
    }
  });

  socket.on("playAgain", function (data) {
    const { id, name, score, typePicked, isWinner, room } = data;

    roomsInfo.get(room).get(id).typePicked = "";
    roomsInfo.get(room).get(id).isWinner = false;

    roomsInfo.get(roomsInfo.get(room).get(id));
  });

  socket.on("disconnect", function (data) {
    showOnConsola("disconnect");
  });

  socket.on("exitGame", (data) => {
    const { id, name, score, typePicked, isWinner, room } = data;

    if (roomsInfo.has(room) && roomsInfo.get(room).size > 0) {
      roomsInfo.get(room).delete(id);
    }

    showOnConsola("exitGame" + id);
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
