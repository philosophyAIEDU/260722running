import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { buildColoredSegments } from '../lib/geo';
import { colors, radii, zoneColors, zoneLabels } from '../theme';
import type { ActivityMode, Coordinate } from '../types';
import type { SpeedZone } from '../lib/geo';

const ZONE_ORDER: SpeedZone[] = ['zone1', 'zone2', 'zone3'];

export default function RouteMap({
  coordinates,
  mode,
  height = 220,
}: {
  coordinates: Coordinate[];
  mode: ActivityMode;
  height?: number;
}) {
  const segments = useMemo(() => buildColoredSegments(coordinates, mode), [coordinates, mode]);

  const region = useMemo(() => {
    if (coordinates.length === 0) return null;
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLon = coordinates[0].longitude;
    let maxLon = coordinates[0].longitude;
    for (const c of coordinates) {
      minLat = Math.min(minLat, c.latitude);
      maxLat = Math.max(maxLat, c.latitude);
      minLon = Math.min(minLon, c.longitude);
      maxLon = Math.max(maxLon, c.longitude);
    }
    const latDelta = Math.max((maxLat - minLat) * 1.6, 0.003);
    const lonDelta = Math.max((maxLon - minLon) * 1.6, 0.003);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  }, [coordinates]);

  if (!region) {
    return (
      <View style={[styles.container, { height }, styles.empty]}>
        <Text style={styles.emptyText}>경로 데이터가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.container, { height }]}>
        <MapView style={StyleSheet.absoluteFill} initialRegion={region}>
          {segments.map((segment, i) => (
            <Polyline
              key={`halo-${i}`}
              coordinates={segment.coordinates}
              strokeColor="rgba(255,255,255,0.85)"
              strokeWidth={7}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {segments.map((segment, i) => (
            <Polyline
              key={`line-${i}`}
              coordinates={segment.coordinates}
              strokeColor={zoneColors[segment.zone]}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          <Marker coordinate={coordinates[0]} pinColor="#1baf7a" title="시작" />
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            pinColor="#eb6834"
            title="종료"
          />
        </MapView>
      </View>
      <View style={styles.legendRow}>
        {ZONE_ORDER.map((zone) => (
          <View key={zone} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: zoneColors[zone] }]} />
            <Text style={styles.legendText}>{zoneLabels[zone]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
