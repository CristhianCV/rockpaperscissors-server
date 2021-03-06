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

const GAME_OPTIONS = {
  ROCK: "rock",
  SCISSOR: "scissors",
  PAPER: "paper",
};

module.exports = {
  GAME_OPTIONS,
  GAME_EVENTS,
};
