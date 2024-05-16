import {
  BOARD,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PLAYER,
  TETROMINOS,
} from '@app/shared/types';

export const createBoard = (): BOARD =>
  Array.from(Array(BOARD_HEIGHT), () => Array(BOARD_WIDTH).fill([0, 'clear']));

export const randomTetromino = () => {
  const tetrominos = [
    'I',
    'J',
    'L',
    'O',
    'S',
    'T',
    'Z',
  ] as (keyof typeof TETROMINOS)[];
  const randTetromino =
    tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

/**
 * Checks if the player's tetromino is colliding with the stage.
 *
 * @param player - The player object representing the current tetromino.
 * @param stage - The stage object representing the game board.
 * @param move - The movement object containing the x and y coordinates to move the tetromino.
 * @returns True if there is a collision, false otherwise.
 */
export const isColliding = (
  player: PLAYER,
  board: BOARD,
  { x: moveX, y: moveY }: { x: number; y: number },
) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      if (player.tetromino[y][x] !== 0) {
        if (
          !board[y + player.pos.y + moveY] ||
          !board[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          board[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !==
            'clear'
        ) {
          return true;
        }
      }
    }
  }

  return false;
};
