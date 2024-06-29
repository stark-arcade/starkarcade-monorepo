export function rotatePointWithRadius(
  px: number,
  py: number,
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  direction: number,
) {
  let translatedX = px - cx;
  let translatedY = py - cy;

  // Calculate the original distance from the center
  let originalDistance = Math.sqrt(
    translatedX * translatedX + translatedY * translatedY,
  );

  // Calculate the unit vector
  let unitX = translatedX / originalDistance;
  let unitY = translatedY / originalDistance;

  // Scale the unit vector by the new radius
  let scaledX = unitX * radius;
  let scaledY = unitY * radius;

  // Apply the rotation
  let realAngle = angle * direction;
  let rotatedX = scaledX * Math.cos(realAngle) - scaledY * Math.sin(realAngle);
  let rotatedY = scaledX * Math.sin(realAngle) + scaledY * Math.cos(realAngle);

  // Translate the point back
  let finalX: number = rotatedX + cx;
  let finalY: number = rotatedY + cy;

  return { x: finalX, y: finalY };
}

export function distance_between_two_point(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
