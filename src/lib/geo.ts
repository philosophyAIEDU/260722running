import type { ActivityMode, Coordinate } from '../types';

const EARTH_RADIUS_M = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in meters. */
export function haversineDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

// GPS points with worse accuracy than this (meters) are dropped.
export const MAX_ACCURACY_M = 20;
// Consecutive points implying a speed above this (m/s) are treated as a GPS jump and dropped.
export const MAX_JUMP_SPEED_MPS = 100;

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatDistanceKm(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/** seconds per km -> "m:ss" per km string. */
export function formatPace(secondsPerKm: number): string {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export type SpeedZone = 'zone1' | 'zone2' | 'zone3';

// km/h thresholds between zone1 (easy) / zone2 (moderate) / zone3 (fast) per mode.
const ZONE_THRESHOLDS_KMH: Record<ActivityMode, [number, number]> = {
  walking: [4, 6],
  running: [8, 12],
  cycling: [15, 25],
};

export function classifySpeedZone(
  speedKmh: number,
  mode: ActivityMode
): SpeedZone {
  const [low, high] = ZONE_THRESHOLDS_KMH[mode];
  if (speedKmh < low) return 'zone1';
  if (speedKmh < high) return 'zone2';
  return 'zone3';
}

/** Cadence-based rough step estimate; only meaningful for walking/running. */
export function estimateSteps(
  distanceMeters: number,
  durationSeconds: number,
  mode: ActivityMode
): number {
  if (durationSeconds <= 0) return 0;
  const speedKmh = distanceMeters / 1000 / (durationSeconds / 3600);
  const cadenceSpm =
    mode === 'walking'
      ? Math.min(140, Math.max(90, 90 + speedKmh * 10))
      : Math.min(190, Math.max(150, 150 + speedKmh * 3));
  return Math.round(cadenceSpm * (durationSeconds / 60));
}

export interface ZoneDurations {
  zone1: number;
  zone2: number;
  zone3: number;
}

export function computeZoneDurations(
  coordinates: Coordinate[],
  mode: ActivityMode
): ZoneDurations {
  const zones: ZoneDurations = { zone1: 0, zone2: 0, zone3: 0 };
  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i - 1];
    const b = coordinates[i];
    const dt = (b.timestamp - a.timestamp) / 1000;
    if (dt <= 0) continue;
    const speedKmh = b.speed ?? (haversineDistance(a, b) / dt) * 3.6;
    zones[classifySpeedZone(speedKmh, mode)] += dt;
  }
  return zones;
}

export interface RouteSegment {
  coordinates: { latitude: number; longitude: number }[];
  zone: SpeedZone;
}

/** Groups consecutive same-zone points into polyline segments for map rendering. */
export function buildColoredSegments(
  coordinates: Coordinate[],
  mode: ActivityMode
): RouteSegment[] {
  if (coordinates.length < 2) return [];

  const segments: RouteSegment[] = [];
  let currentZone: SpeedZone | null = null;
  let currentPoints: { latitude: number; longitude: number }[] = [];

  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i - 1];
    const b = coordinates[i];
    const dt = (b.timestamp - a.timestamp) / 1000;
    const speedKmh = dt > 0 ? b.speed ?? (haversineDistance(a, b) / dt) * 3.6 : 0;
    const zone = classifySpeedZone(speedKmh, mode);

    if (zone !== currentZone) {
      if (currentPoints.length > 1) {
        segments.push({ coordinates: currentPoints, zone: currentZone as SpeedZone });
      }
      currentZone = zone;
      currentPoints = [a, b];
    } else {
      currentPoints.push(b);
    }
  }

  if (currentZone && currentPoints.length > 1) {
    segments.push({ coordinates: currentPoints, zone: currentZone });
  }

  return segments;
}
