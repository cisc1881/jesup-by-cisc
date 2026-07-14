/** Coarse coordinate bucketing — do not persist precise browser coordinates. */

export function bucketCoordinate(value: number): number {
  return Math.round(value * 10) / 10;
}

export function bucketCoordinates(
  lat: number,
  lon: number,
): { latitudeBucket: number; longitudeBucket: number } {
  return {
    latitudeBucket: bucketCoordinate(lat),
    longitudeBucket: bucketCoordinate(lon),
  };
}

export function bucketsMatch(
  a: { latitudeBucket: number | null; longitudeBucket: number | null },
  b: { latitudeBucket: number | null; longitudeBucket: number | null },
): boolean {
  return a.latitudeBucket === b.latitudeBucket && a.longitudeBucket === b.longitudeBucket;
}
