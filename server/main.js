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
  KICK_PLAYER: "KICK_PLAYER",
};

io.on("connection", function (socket) {
  socket.on(GAME_EVENTS.CREATE_ROOM, (hostName) => {
    let roomId = getRandomId();
    let hostId = getRandomId();

    const hostMapInfo = new Map();
    hostMapInfo.set(hostId, {
      id: hostId,
      name: hostName,
      typePicked: "",
      score: 0,
    });
    roomsInfo.set(roomId, hostMapInfo);

    socket.join(roomId);

    socket.emit(GAME_EVENTS.ROOM_CREATED, {
      error: "",
      data: { roomId: roomId, hostId: hostId },
    });
    // showOnConsola(GAME_EVENTS.ROOM_CREATED + ": " + roomId);
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
    // console.log(GAME_EVENTS.VERIFY_ROOM_AVAILABILITY);
  });

  socket.on(GAME_EVENTS.JOIN_ROOM, (data) => {
    // showOnConsola(GAME_EVENTS.JOIN_ROOM);
    const { name, roomId } = data;

    let gestId = getRandomId();

    roomsInfo
      .get(roomId)
      .set(gestId, { id: gestId, name, typePicked: "", score: 0 });
    socket.join(roomId);

    if (roomsInfo.get(roomId).size === 2) {
      io.sockets.to(roomId).emit(GAME_EVENTS.GAME_IS_READY, {
        error: "",
        data: {
          host: {
            name: roomsInfo.get(roomId).values().next().value.name,
            id: roomsInfo.get(roomId).values().next().value.id,
          },
          opponent: {
            name,
            id: gestId,
          },
        },
      });
      // showOnConsola("ready");
    }
  });

  socket.on(GAME_EVENTS.USER_PICKED, function (data) {
    try {
      const { id, typePicked, room } = data;
      roomsInfo.get(room).get(id).typePicked = typePicked;

      let idPlayers = Array.from(roomsInfo.get(room).keys());
      const host = roomsInfo.get(room).get(idPlayers[0]);
      const opponent = roomsInfo.get(room).get(idPlayers[1]);

      // showOnConsola("picked", roomsInfo.get(room));

      const hostTypePicked = host.typePicked;
      const opponentTypePicked = opponent.typePicked;

      if (hostTypePicked !== "" && opponentTypePicked !== "") {
        let winnerIndex = getWinner(hostTypePicked, opponentTypePicked);
        // showOnConsola("winnerIndex" + winnerIndex);

        io.sockets.to(room).emit(GAME_EVENTS.GAME_RESULT, {
          error: "",
          data: {
            isWinner: winnerIndex,
            host,
            opponent,
          },
        });
      }
    } catch (error) {
      io.sockets.to(room).emit(GAME_EVENTS.GAME_RESULT, {
        error: error.message,
        data: null,
      });
    }
  });

  socket.on(GAME_EVENTS.PLAY_AGAIN_REQUEST, function (data) {
    const { room, id } = data;

    roomsInfo.get(room).get(id).typePicked = "";

    let idPlayers = Array.from(roomsInfo.get(room).keys());
    const host = roomsInfo.get(room).get(idPlayers[0]);
    const opponent = roomsInfo.get(room).get(idPlayers[1]);

    // showOnConsola(GAME_EVENTS.PLAY_AGAIN_REQUEST);

    if (
      roomsInfo.get(room).size === 2 &&
      host.typePicked.trim() === "" &&
      opponent.typePicked.trim() === ""
    ) {
      io.sockets.to(room).emit(GAME_EVENTS.PLAY_AGAIN, {
        error: "",
        data: null,
      });
      // showOnConsola(GAME_EVENTS.PLAY_AGAIN);
    }
  });

  socket.on("disconnect", function (data) {
    // showOnConsola("disconnect");
  });

  socket.on(GAME_EVENTS.EXIT_GAME, (data) => {
    const { room } = data;
    roomsInfo.set(room, new Map());
    io.sockets.to(room).emit(GAME_EVENTS.KICK_PLAYER, {
      error: "",
      data: null,
    });
    // showOnConsola(GAME_EVENTS.EXIT_GAME);
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
