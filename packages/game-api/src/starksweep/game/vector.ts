export function add_two_vectors(
  x1: string,
  y1: string,
  x2: string,
  y2: string,
) {
  return {
    x: (parseFloat(x1) + parseFloat(x2)).toString(),
    y: (parseFloat(y1) + parseFloat(y2)).toString(),
  };
}

export function subtract_two_vectors(
  x1: string,
  y1: string,
  x2: string,
  y2: string,
) {
  return {
    x: (parseFloat(x1) - parseFloat(x2)).toString(),
    y: (parseFloat(y1) - parseFloat(y2)).toString(),
  };
}
