export function rotatePointWithRadius(
  px: string,
  py: string,
  cx: string,
  cy: string,
  angle: number,
  radius: string,
  direction: number,
) {
  let translatedX = parseFloat(px) - parseFloat(cx);
  let translatedY = parseFloat(py) - parseFloat(cy);

  // Calculate the original distance from the center
  let originalDistance = Math.sqrt(
    translatedX * translatedX + translatedY * translatedY,
  );

  // Calculate the unit vector
  let unitX = translatedX / originalDistance;
  let unitY = translatedY / originalDistance;

  // Scale the unit vector by the new radius
  let scaledX = unitX * parseFloat(radius);
  let scaledY = unitY * parseFloat(radius);

  // Apply the rotation
  let realAngle = angle * direction;
  let rotatedX = scaledX * Math.cos(realAngle) - scaledY * Math.sin(realAngle);
  let rotatedY = scaledX * Math.sin(realAngle) + scaledY * Math.cos(realAngle);

  // Translate the point back
  let finalX: number = rotatedX + parseFloat(cx);
  let finalY: number = rotatedY + parseFloat(cy);

  return { x: finalX.toString(), y: finalY.toString() };
}

export function distance_between_two_point(
  x1: string,
  y1: string,
  x2: string,
  y2: string,
) {
  return Math.sqrt(
    Math.pow(parseFloat(x2) - parseFloat(x1), 2) +
      Math.pow(parseFloat(y2) - parseFloat(y1), 2),
  );
}
