import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, zoneColors, zoneLabels } from '../theme';
import type { ActivityMode, Coordinate } from '../types';
import type { SpeedZone } from '../lib/geo';

const ZONE_ORDER: SpeedZone[] = ['zone1', 'zone2', 'zone3'];

// Web fallback: react-native-maps is native-only. This keeps `expo export --platform web`
// bundling cleanly; the interactive map only renders on iOS/Android via RouteMap.native.tsx.
export default function RouteMap({
  coordinates,
  height = 220,
}: {
  coordinates: Coordinate[];
  mode: ActivityMode;
  height?: number;
}) {
  return (
    <View>
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>
          경로 지도는 모바일 앱(iOS/Android)에서 확인할 수 있어요.
        </Text>
        <Text style={styles.pointCount}>기록된 좌표 {coordinates.length}개</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  pointCount: {
    color: colors.textMuted,
    fontSize: 12,
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
