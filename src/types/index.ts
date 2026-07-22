export type ActivityMode = 'running' | 'walking' | 'cycling';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number; // km/h
}

export interface CyclingZones {
  zone1: number; // seconds
  zone2: number;
  zone3: number;
}

export interface RunSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // seconds
  distance: number; // meters
  pace: number; // seconds per km
  averageSpeed: number; // km/h
  coordinates: Coordinate[];
  mode: ActivityMode;
  steps?: number;
  cyclingZones?: CyclingZones;
}
