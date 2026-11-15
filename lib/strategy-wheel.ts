export function wrapIndex(value: number, count: number) {
  return ((value % count) + count) % count;
}

// Choose the nearest copy of an item on the continuous, circular index.
export function nearestPosition(index: number, position: number, count: number) {
  return index + Math.round((position - index) / count) * count;
}

export function wheelDistance(index: number, position: number, count: number) {
  return nearestPosition(index, position, count) - position;
}

// The closed-form critically damped spring behaves the same at 60 and 120 Hz.
export function springStep(position: number, velocity: number, target: number, seconds: number, frequency = 17) {
  const offset = position - target;
  const impulse = (velocity + frequency * offset) * seconds;
  const decay = Math.exp(-frequency * seconds);
  return {
    position: target + (offset + impulse) * decay,
    velocity: (velocity - frequency * impulse) * decay,
  };
}

export function releaseTarget(position: number, velocity: number) {
  return Math.round(position + Math.max(-1.4, Math.min(1.4, velocity * .14)));
}

export function wheelAppearance(distance: number, expansion = 0) {
  const angle = Math.max(-.8, Math.min(.8, distance * .22));
  const spread = 1 + expansion * .14;
  const abs = Math.abs(distance);
  return {
    x: -(1 - Math.cos(angle)) / .22 * .85 * spread,
    y: Math.sin(angle) / .22 * spread,
    angle: distance * 4,
    scale: (1 + expansion * .4) * (1 - Math.min(abs, 3) * .025),
    opacity: Math.max(0, 1 - abs * .44),
    blur: Math.min(4.5, Math.pow(abs, 1.2) * 1.6),
  };
}
