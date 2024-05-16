/**
 *  array limit process
 * @param array
 * @param callBack
 * @param limit default 100
 * @returns
 */
export const arraySliceProcess = async <T>(
  array: T[],
  callBack: (value: T[]) => Promise<any>,
  limit = 100,
) => {
  if (array.length === 0) return;
  for (let i = 0; i < array.length; i += limit) {
    const arrayToProcess = array.slice(i, i + limit);
    await callBack(arrayToProcess);
  }
};

export const emptyArray = <T>(size: number, defaultValue: T): T[] =>
  Array(size).fill(defaultValue);

export const emptyGrid = <T>(size: number, defaultValue: T): T[][] =>
  emptyArray(size, []).map(() => emptyArray(size, defaultValue));
