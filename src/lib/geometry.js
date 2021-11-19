export function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

export function center(x1, y1, x2, y2) {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2
  };
}
