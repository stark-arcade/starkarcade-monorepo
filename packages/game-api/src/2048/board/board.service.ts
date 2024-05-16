import {
  Direction,
  IncreaseTiles,
  MoveResult,
  Position,
  WINNING_POWER,
} from '@app/shared/types';
import { emptyArray, serialize } from '@app/shared/utils';
import { applyGravity } from './gravity';
import { allDirections } from './direction';
import { WsException } from '@nestjs/websockets';

export class BoardService {
  private grid: number[][];
  private size: number;
  constructor(private gridSize: number) {
    if (gridSize < 4 || gridSize > 8) {
      throw new WsException('Wrong game size');
    }

    this.size = gridSize;
    this.grid = emptyArray(this.gridSize, []).map(() =>
      emptyArray(this.gridSize, 0),
    );
    const filterIncrease = IncreaseTiles.find((i) => i.size === gridSize);
    for (
      let i = 0;
      i < filterIncrease.increaseTiles + filterIncrease.initTiles;
      i++
    ) {
      this.add();
    }
  }

  private hasWinningValue(): number {
    let winningCounter = 0;
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        if (this.grid[i][j] >= WINNING_POWER) {
          winningCounter += Math.floor(this.grid[i][j] / WINNING_POWER);
        }
      }
    }
    return winningCounter;
  }

  private emptyPositions(): Position[] {
    return this.grid.flatMap((values, row) =>
      values.reduce<Position[]>((arr, value, column) => {
        if (value === 0) {
          return [...arr, { row, column }];
        }
        return arr;
      }, []),
    );
  }

  private changeGravity(direction: Direction) {
    this.grid = applyGravity(this.grid, direction);
  }

  private getRandomFreePosition(): Position | null {
    // Find an empty position
    const availablePositions = this.emptyPositions();
    if (availablePositions.length === 0) {
      // the board is full!
      return null;
    }
    const randomPositionIndex = Math.floor(
      Math.random() * availablePositions.length,
    );
    return availablePositions[randomPositionIndex];
  }

  private add(value = 1) {
    const position = this.getRandomFreePosition();
    if (position === null) {
      // Move is not valid
      return;
    }
    this.grid[position.row][position.column] = value;
  }

  public hasNoValidMoves() {
    const currentSnapshot = this.serialize();
    return allDirections.every((direction) => {
      const possibleGird = applyGravity(this.grid, direction);
      return serialize(possibleGird) === currentSnapshot;
    });
  }

  /**
   * Make a move
   * @param direction
   * @public
   * @returns Returns an enum saying if it is a winning, normal or losing move
   */
  public move(
    direction: Direction,
    size: number,
  ): { winningCounter: number; result: MoveResult } {
    this.changeGravity(direction);
    const winningCounter = this.hasWinningValue();
    const inscreaseTiles = IncreaseTiles.find((t) => t.size === size);
    for (let i = 0; i < inscreaseTiles.increaseTiles; i++) {
      this.add();
    }
    if (this.emptyPositions().length === 0 && this.hasNoValidMoves()) {
      return { winningCounter, result: 'lose' };
    }
    return { winningCounter, result: 'none' };
  }

  public getSize(): number {
    return this.size;
  }

  /**
   * Serializes the grid to be sent over network in a semi-compressed way ( could be compressed further easily )
   * @returns {string} Serialized grid
   */
  public serialize(): string {
    return serialize(this.grid);
  }
}
