var express = require("express");
var cors = require("cors");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

app.use(cors());

var roomsInfo = new Map();
const types = { ROCK: "rock", SCISSOR: "scissors", PAPER: "paper" };

const GAME_EVENTS = {
  CREATE_ROOM: "CREATE_ROOM",
  ROOM_CREATED: "ROOM_CREATED",
  VERIFY_ROOM_AVAILABILITY: "VERIFY_ROOM_AVAILABILITY",
  VERIFY_ROOM_AVAILABILITY_RESULT: "VERIFY_ROOM_AVAILABILITY_RESULT",
  JOIN_ROOM: "JOIN_ROOM",
  GAME_IS_READY: "GAME_IS_READY",
  USER_PICKED: "USER_PICKED",
  GAME_RESULT: "GAME_RESULT",
  PLAY_AGAIN_REQUEST: "PLAY_AGAIN_REQUEST",
  PLAY_AGAIN: "PLAY_AGAIN",
  EXIT_GAME: "EXIT_GAME",
};

io.on("connection", function (socket) {
  socket.on(GAME_EVENTS.CREATE_ROOM, (hostName) => {
    let roomId = getRandomId();
    let hostId = getRandomId();

    roomsInfo.set(roomId, new Map());
    roomsInfo
      .get(roomId)
      .set(hostId, { id: hostId, name: hostName, typePicked: "", score: 0 });
    socket.join(roomId);

    socket.emit(GAME_EVENTS.ROOM_CREATED, {
      error: "",
      data: { roomId: roomId, hostId: hostId },
    });
    console.log("create room " + roomId);
  });

  socket.on(GAME_EVENTS.VERIFY_ROOM_AVAILABILITY, (room) => {
    if (!roomsInfo.has(room) || roomsInfo.get(room).size === 0) {
      socket.emit(GAME_EVENTS.VERIFY_ROOM_AVAILABILITY_RESULT, {
        error: "The room isn't available.",
        data: null,
      });
    } else {
      socket.emit(GAME_EVENTS.VERIFY_ROOM_AVAILABILITY_RESULT, {
        error: "",
        data: null,
      });
    }
    console.log("verify room");
  });

  socket.on(GAME_EVENTS.JOIN_ROOM, (data) => {
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
        io.sockets.to(room).emit(GAME_EVENTS.GAME_IS_READY, {
          code: "OK",
          message: "The game is ready to start",
        });
        showOnConsola("ready");
      }
    }
  });

  socket.on(GAME_EVENTS.USER_PICKED, function (data) {
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
        roomsInfo.get(room).get(idPlayers[winnerIndex - 1]).score += 1;
      }
      io.sockets.to(room).emit(GAME_EVENTS.GAME_RESULT, {
        idWinner: winnerIndex
          ? roomsInfo.get(room).get(idPlayers[winnerIndex - 1]).id
          : 0,
        players: Array.from(roomsInfo.get(room).values()),
      });
      showOnConsola(Array.from(roomsInfo.get(room).values()));
    }
  });

  socket.on(GAME_EVENTS.PLAY_AGAIN_REQUEST, function (data) {
    const { id, name, score, typePicked, isWinner, room } = data;

    roomsInfo.get(room).get(id).typePicked = "";

    let idPlayers = Array.from(roomsInfo.get(room).keys());

    if (
      roomsInfo.get(room).size === 2 &&
      roomsInfo.get(room).get(idPlayers[0]).typePicked.trim() !== "" &&
      roomsInfo.get(room).get(idPlayers[1]).typePicked.trim() !== ""
    ) {
      io.sockets.to(room).emit(GAME_EVENTS.PLAY_AGAIN);
      showOnConsola("reload");
    }
  });

  socket.on("disconnect", function (data) {
    showOnConsola("disconnect");
  });

  socket.on(GAME_EVENTS.EXIT_GAME, (data) => {
    const { id, name, score, typePicked, isWinner, room } = data;

    if (roomsInfo.has(room) && roomsInfo.get(room).has(id)) {
      roomsInfo.get(room).delete(id);
    }

    showOnConsola(GAME_EVENTS.EXIT_GAME + id);
  });
});

app.get("/api/hello", function (req, res, next) {
  res.send({
    message: "Hello",
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

function showOnConsola(message) {
  console.log(message);
}

function getRandomId() {
  return Math.random().toString(36).substr(2, 9);
}

app.set("puerto", process.env.PORT || 3000);

server.listen(app.get("puerto"), function () {
  console.log("Servidor corriendo en" + app.get("puerto"));
});
