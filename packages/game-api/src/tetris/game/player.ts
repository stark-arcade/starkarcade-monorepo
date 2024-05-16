import { BOARD_WIDTH, PLAYER } from '@app/shared/types';
import { randomTetromino } from './helper';

export const resetPlayer = (): PLAYER => {
  return {
    pos: { x: BOARD_WIDTH / 2 - 2, y: 0 },
    tetromino: randomTetromino().shape,
    collided: false,
  };
};

export const updatePlayerPos = (
  player: PLAYER,
  param: {
    x: number;
    y: number;
    collided: boolean;
  },
): PLAYER => {
  return {
    tetromino: player.tetromino,
    pos: { x: (player.pos.x += param.x), y: (player.pos.y += param.y) },
    collided: param.collided,
  };
};
