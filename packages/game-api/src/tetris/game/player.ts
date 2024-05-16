import { BOARD_WIDTH, PLAYER } from '@app/shared/types';
import { isColliding, randomTetromino } from './helper';
import { TetrisGameParam } from '../tetris.service';

export const resetPlayer = (): PLAYER => {
  return {
    pos: { x: BOARD_WIDTH / 2 - 2, y: 0 },
    tetromino: randomTetromino().shape,
    collided: false,
  };
};

const rotate = (matrix: PLAYER['tetromino']) => {
  // Make the rows to become cols (transpose)
  const mtrx = matrix.map((_, i) => matrix.map((column) => column[i]));
  // Reverse each row to get a rotated matrix
  return mtrx.map((row) => row.reverse());
};

export const playerRotate = (client: TetrisGameParam): PLAYER => {
  const clonedPlayer = JSON.parse(JSON.stringify(client.player));
  clonedPlayer.tetromino = rotate(clonedPlayer.tetromino);

  // This one is so the player can't rotate into the walls or other tetrominos that's merged
  const posX = clonedPlayer.pos.x;
  let offset = 1;
  while (isColliding(clonedPlayer, client.board, { x: 0, y: 0 })) {
    clonedPlayer.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));

    if (offset > clonedPlayer.tetromino[0].length) {
      clonedPlayer.pos.x = posX;
      return;
    }
  }

  return clonedPlayer;
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
