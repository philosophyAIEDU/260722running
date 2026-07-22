import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  computeZoneDurations,
  estimateSteps,
  haversineDistance,
  MAX_ACCURACY_M,
  MAX_JUMP_SPEED_MPS,
} from '../lib/geo';
import { generateId } from '../lib/id';
import type { ActivityMode, Coordinate, RunSession } from '../types';

export type TrackerStatus = 'idle' | 'tracking' | 'stopped';

export function useActivityTracker() {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [mode, setMode] = useState<ActivityMode>('running');
  const [distance, setDistance] = useState(0); // meters
  const [duration, setDuration] = useState(0); // seconds
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const lastAcceptedRef = useRef<Coordinate | null>(null);
  const distanceRef = useRef(0);
  const coordinatesRef = useRef<Coordinate[]>([]);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      watchSubRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleLocation = useCallback((loc: Location.LocationObject) => {
    const { latitude, longitude, accuracy, speed } = loc.coords;
    const timestamp = loc.timestamp;

    if (accuracy != null && accuracy > MAX_ACCURACY_M) {
      return;
    }

    const point: Coordinate = {
      latitude,
      longitude,
      timestamp,
      accuracy: accuracy ?? undefined,
      speed: speed != null && speed >= 0 ? speed * 3.6 : undefined,
    };

    const last = lastAcceptedRef.current;
    if (last) {
      const dtSeconds = (timestamp - last.timestamp) / 1000;
      const deltaMeters = haversineDistance(last, point);

      if (dtSeconds > 0) {
        const speedMps = deltaMeters / dtSeconds;
        if (speedMps > MAX_JUMP_SPEED_MPS) {
          // Likely a GPS jump; ignore this point entirely.
          return;
        }
        setCurrentSpeed(point.speed ?? speedMps * 3.6);
      }

      distanceRef.current += deltaMeters;
      setDistance(distanceRef.current);
    }

    lastAcceptedRef.current = point;
    coordinatesRef.current = [...coordinatesRef.current, point];
    setCoordinates(coordinatesRef.current);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    return permStatus === 'granted';
  }, []);

  const start = useCallback(
    async (selectedMode: ActivityMode) => {
      const granted = await requestPermission();
      if (!granted) {
        throw new Error('LOCATION_PERMISSION_DENIED');
      }

      setMode(selectedMode);
      setStatus('tracking');
      setDistance(0);
      setDuration(0);
      setCurrentSpeed(0);
      setCoordinates([]);
      distanceRef.current = 0;
      coordinatesRef.current = [];
      lastAcceptedRef.current = null;
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      watchSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        handleLocation
      );
    },
    [handleLocation, requestPermission]
  );

  const stop = useCallback((): RunSession | null => {
    if (!startTimeRef.current) return null;

    watchSubRef.current?.remove();
    watchSubRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const endTime = Date.now();
    const finalDuration = Math.floor((endTime - startTimeRef.current) / 1000);
    const finalDistance = distanceRef.current;
    const pace = finalDistance > 0 ? finalDuration / (finalDistance / 1000) : 0;
    const averageSpeed = finalDuration > 0 ? finalDistance / finalDuration * 3.6 : 0;

    const session: RunSession = {
      id: generateId(),
      startTime: startTimeRef.current,
      endTime,
      duration: finalDuration,
      distance: finalDistance,
      pace,
      averageSpeed,
      coordinates: coordinatesRef.current,
      mode,
      ...(mode === 'cycling'
        ? { cyclingZones: computeZoneDurations(coordinatesRef.current, mode) }
        : { steps: estimateSteps(finalDistance, finalDuration, mode) }),
    };

    setStatus('stopped');
    startTimeRef.current = null;
    return session;
  }, [mode]);

  const reset = useCallback(() => {
    setStatus('idle');
    setDistance(0);
    setDuration(0);
    setCurrentSpeed(0);
    setCoordinates([]);
    distanceRef.current = 0;
    coordinatesRef.current = [];
    lastAcceptedRef.current = null;
    startTimeRef.current = null;
  }, []);

  return {
    status,
    mode,
    distance,
    duration,
    currentSpeed,
    coordinates,
    start,
    stop,
    reset,
  };
}
