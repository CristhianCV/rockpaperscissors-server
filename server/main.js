var express = require("express");
var cors = require("cors");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var { GAME_EVENTS, GAME_OPTIONS } = require("./constants");

app.use(cors());

var roomsInfo = new Map();
io.on("connection", function (socket) {
  socket.on(GAME_EVENTS.CREATE_ROOM, (hostName) => {
    try {
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

      showOnConsola(GAME_EVENTS.CREATE_ROOM + ": " + roomId);
    } catch (error) {
      emitError(
        socket,
        GAME_EVENTS.ROOM_CREATED,
        "An error occurred while creating the room."
      );
    }
  });

  socket.on(GAME_EVENTS.VERIFY_ROOM_AVAILABILITY, (room) => {
    try {
      let errorMessage = "";
      if (!roomsInfo.has(room) || roomsInfo.get(room).size === 0) {
        errorMessage = "The room isn't available.";
      } else if (roomsInfo.get(room).size === 2) {
        errorMessage = "The room is full.";
      }
      socket.emit(GAME_EVENTS.VERIFY_ROOM_AVAILABILITY_RESULT, {
        error: errorMessage,
        data: null,
      });
    } catch (error) {
      emitError(
        socket,
        GAME_EVENTS.VERIFY_ROOM_AVAILABILITY_RESULT,
        "An error occurred while verifying the room availability."
      );
    }
  });

  socket.on(GAME_EVENTS.JOIN_ROOM, (data) => {
    const { name, roomId } = data;

    try {
      let gestId = getRandomId();

      roomsInfo
        .get(roomId)
        .set(gestId, { id: gestId, name, typePicked: "", score: 0 });
      socket.join(roomId);

      if (roomsInfo.get(roomId).size === 2) {
        emitEvent(GAME_EVENTS.GAME_IS_READY, roomId, "", {
          host: {
            name: roomsInfo.get(roomId).values().next().value.name,
            id: roomsInfo.get(roomId).values().next().value.id,
          },
          opponent: {
            name,
            id: gestId,
          },
        });
        showOnConsola(GAME_EVENTS.GAME_IS_READY + ": " + roomId);
      }
    } catch (error) {
      emitError(
        socket,
        GAME_EVENTS.GAME_IS_READY,
        "An error occurred while joining the room."
      );
    }
  });

  socket.on(GAME_EVENTS.USER_PICKED, function (data) {
    try {
      const { id, typePicked, room } = data;
      roomsInfo.get(room).get(id).typePicked = typePicked;

      let idPlayers = Array.from(roomsInfo.get(room).keys());
      const host = roomsInfo.get(room).get(idPlayers[0]);
      const opponent = roomsInfo.get(room).get(idPlayers[1]);

      const hostTypePicked = host.typePicked;
      const opponentTypePicked = opponent.typePicked;

      if (hostTypePicked !== "" && opponentTypePicked !== "") {
        let winnerIndex = getWinner(hostTypePicked, opponentTypePicked);
        emitEvent(GAME_EVENTS.GAME_RESULT, room, "", {
          isWinner: winnerIndex,
          host,
          opponent,
        });
      }
      showOnConsola(GAME_EVENTS.USER_PICKED + ": " + room);
    } catch (error) {
      emitError(
        socket,
        GAME_EVENTS.GAME_RESULT,
        "An error occurred while setting the result."
      );
    }
  });

  socket.on(GAME_EVENTS.PLAY_AGAIN_REQUEST, function (data) {
    const { room, id } = data;

    try {
      roomsInfo.get(room).get(id).typePicked = "";
      let idPlayers = Array.from(roomsInfo.get(room).keys());
      const host = roomsInfo.get(room).get(idPlayers[0]);
      const opponent = roomsInfo.get(room).get(idPlayers[1]);

      showOnConsola(GAME_EVENTS.PLAY_AGAIN_REQUEST + ": " + room);

      if (
        roomsInfo.get(room).size === 2 &&
        host.typePicked.trim() === "" &&
        opponent.typePicked.trim() === ""
      ) {
        emitEvent(GAME_EVENTS.PLAY_AGAIN, room);
        showOnConsola(GAME_EVENTS.PLAY_AGAIN + ": " + room);
      }
    } catch (error) {
      emitError(
        socket,
        GAME_EVENTS.PLAY_AGAIN,
        "An error occurred while reloading the game."
      );
    }
  });

  socket.on("disconnect", function (data) {
    showOnConsola("disconnect");
  });

  socket.on(GAME_EVENTS.EXIT_GAME, (data) => {
    const { room } = data;
    try {
      roomsInfo.set(room, new Map());
      emitEvent(GAME_EVENTS.KICK_PLAYER, room);
      showOnConsola(GAME_EVENTS.KICK_PLAYER + ": " + room);
    } catch (error) {
      emitError(
        socket,
        GAME_EVENTS.KICK_PLAYER,
        "An error occurred while exiting the game."
      );
    }
  });
});

const getWinner = (playerOneSelectedType, playerTwoSelectedType) => {
  let playerWinner = 0;
  switch (playerOneSelectedType) {
    case GAME_OPTIONS.ROCK:
      switch (playerTwoSelectedType) {
        case GAME_OPTIONS.ROCK:
          playerWinner = 0;
          break;
        case GAME_OPTIONS.PAPER:
          playerWinner = 2;
          break;
        case GAME_OPTIONS.SCISSOR:
          playerWinner = 1;
          break;
        default:
          break;
      }
      break;
    case GAME_OPTIONS.PAPER:
      switch (playerTwoSelectedType) {
        case GAME_OPTIONS.ROCK:
          playerWinner = 1;
          break;
        case GAME_OPTIONS.PAPER:
          playerWinner = 0;
          break;
        case GAME_OPTIONS.SCISSOR:
          playerWinner = 2;
          break;
        default:
          break;
      }
      break;
    case GAME_OPTIONS.SCISSOR:
      switch (playerTwoSelectedType) {
        case GAME_OPTIONS.ROCK:
          playerWinner = 2;
          break;
        case GAME_OPTIONS.PAPER:
          playerWinner = 1;
          break;
        case GAME_OPTIONS.SCISSOR:
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

function emitError(socket, message = "") {
  socket.emit(event, {
    error: message,
    data: null,
  });
}

function emitEvent(event, room, message = "", data = null) {
  io.sockets.to(room).emit(event, {
    error: message,
    data: data,
  });
}

app.set("puerto", process.env.PORT || 3000);

server.listen(app.get("puerto"), function () {
  console.log("Servidor corriendo en" + app.get("puerto"));
});
