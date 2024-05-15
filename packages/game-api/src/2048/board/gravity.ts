import { Direction } from '@app/shared/types';
import { emptyArray, emptyGrid } from '@app/shared/utils';

const computeGetLineParams = (
  start: number,
  direction: Direction,
  length: number,
) => {
  switch (direction) {
    case 'right':
      return {
        sx: length - 1,
        sy: start,
        ix: -1,
        iy: 0,
      };
    case 'left':
      return {
        sx: 0,
        sy: start,
        ix: 1,
        iy: 0,
      };
    case 'up':
      return {
        sx: start,
        sy: 0,
        ix: 0,
        iy: 1,
      };
    default:
    case 'down':
      return {
        sx: start,
        sy: length - 1,
        ix: 0,
        iy: -1,
      };
  }
};

const getLine = (grid: number[][], start: number, direction: Direction) => {
  const { sx, sy, ix, iy } = computeGetLineParams(
    start,
    direction,
    grid.length,
  );
  return emptyArray(grid.length, 0).map(
    (_, i) => grid[sy + i * iy][sx + i * ix],
  );
};

const putLine = (
  grid: number[][],
  start: number,
  direction: Direction,
  line: number[],
) => {
  const { sx, sy, ix, iy } = computeGetLineParams(
    start,
    direction,
    grid.length,
  );
  line.forEach((value, i) => {
    grid[sy + i * iy][sx + i * ix] = value;
  });
};

const reduceList = (list: number[]): number[] => {
  const result: number[] = [];
  for (let i = 0; i < list.length; i++) {
    if (i < list.length - 1 && list[i] === list[i + 1]) {
      result.push(list[i] + 1);
      i++;
    } else {
      result.push(list[i]);
    }
  }
  return result;
};

const splitOnObstacles = (list: number[]): number[][] =>
  list.reduce<number[][]>(
    (lists, value) => {
      lists[lists.length - 1].push(value);
      return lists;
    },
    [[]],
  );

export const applyGravity = (
  grid: number[][],
  direction: Direction,
): number[][] => {
  const newGrid = emptyGrid(grid.length, 0);
  grid.forEach((_, index) => {
    const line = getLine(grid, index, direction);
    const splitLines = splitOnObstacles(line);
    const newLine = splitLines.flatMap((splitLine) => {
      const shiftedLeft = splitLine.filter((value) => value !== 0);
      const reduced = reduceList(shiftedLeft);
      return [...reduced, ...emptyArray(splitLine.length - reduced.length, 0)];
    });
    putLine(newGrid, index, direction, newLine);
  });
  return newGrid;
};
