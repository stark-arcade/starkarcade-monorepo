export const GRID_SIZE = 6;
export const WINNING_VALUE = 2048;
export const WINNING_POWER = Math.log2(WINNING_VALUE);

export const serializationMap =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export type ServerGameStatusParam =
  | 'canceled'
  | 'lost'
  | 'starting'
  | 'started';

export type Direction = 'up' | 'right' | 'down' | 'left';

export type MoveResult = 'win' | 'lose' | 'none';

export enum GameEvents {
  // This event is fired by the client socket when a user starts a new game ( after losing/winning )
  NEW_GAME_EVENT = 'new-game',

  // This event is fired by the client socket when a user sends a command ( up/down/left/right )
  COMMAND_EVENT = 'command',

  // This event is fired by the server socket when the game board changes ( usually after a command is processed )
  BOARD_UPDATED_EVENT = 'board-updated',

  // This event is fired by the server socket when the game status changes ( the game is won / lost / starter / ready-to-restart )
  GAME_STATUS_EVENT = 'game-status',

  // This event is fired by the server socket when the point of game changes (usually after user get a 2048 tile)
  GAME_POINT_EVENT = 'game-point',

  // This event is fired by the server socket when user claim point
  CLAIM_POINT_EVENT = 'claim-point',
}

export const IncreaseTiles = [
  {
    size: 4,
    initTiles: 1,
    increaseTiles: 1,
  },
  {
    size: 5,
    initTiles: 2,
    increaseTiles: 2,
  },
  {
    size: 6,
    initTiles: 2,
    increaseTiles: 3,
  },
  {
    size: 7,
    initTiles: 3,
    increaseTiles: 4,
  },
  {
    size: 8,
    initTiles: 4,
    increaseTiles: 5,
  },
];

export interface Position {
  row: number;
  column: number;
}
