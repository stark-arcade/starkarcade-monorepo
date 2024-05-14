import { serializationMap } from '../types';

export const serialize = (grid: number[][]) =>
  grid.flatMap((row) => row.map((value) => serializationMap[value])).join('');

export const deserialize = (serialized: string): number[][] => {
  const size = Math.sqrt(serialized.length);
  if (Math.ceil(size) !== Math.floor(size)) {
    // This should never happen
    throw new Error("Can't deserialize, the serialized value is not a square");
  }
  return Array(size)
    .fill(0)
    .map((_, row) =>
      Array(size)
        .fill(0)
        .map((_, column) =>
          serializationMap.indexOf(serialized[row * size + column]),
        ),
    );
};
