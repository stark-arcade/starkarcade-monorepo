import { Direction } from '@app/shared/types';

export const allDirections: Direction[] = ['left', 'down', 'right', 'up'];

export const isValidDirection = (direction: string): direction is Direction =>
  allDirections.includes(direction as Direction);
