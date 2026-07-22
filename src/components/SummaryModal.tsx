import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceKm, formatDuration, formatPace } from '../lib/geo';
import { colors, modeGradients, modeMeta, radii, shadow, zoneColors, zoneLabels } from '../theme';
import type { RunSession } from '../types';
import RouteMap from './RouteMap';

export default function SummaryModal({
  visible,
  session,
  onClose,
}: {
  visible: boolean;
  session: RunSession | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!session) return null;

  const meta = modeMeta[session.mode];
  const [gradientStart, gradientEnd] = modeGradients[session.mode];
  const zones = session.cyclingZones;
  const totalZoneSeconds = zones ? zones.zone1 + zones.zone2 + zones.zone3 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadge}>
              <Ionicons name={meta.icon} size={16} color="#fff" />
              <Text style={styles.heroBadgeText}>{meta.label}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.heroDistance}>{formatDistanceKm(session.distance)}</Text>
          <Text style={styles.heroDistanceUnit}>km</Text>
          <View style={styles.heroStatsRow}>
            <HeroStat label="시간" value={formatDuration(session.duration)} />
            <HeroStat label="페이스" value={`${formatPace(session.pace)} /km`} />
            <HeroStat label="평균 속도" value={`${session.averageSpeed.toFixed(1)} km/h`} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {session.mode !== 'cycling' && session.steps != null && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>추정 걸음수</Text>
              <Text style={styles.stepsValue}>{session.steps.toLocaleString('ko-KR')} 걸음</Text>
            </View>
          )}

          {zones && totalZoneSeconds > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>파워존 (구간별 시간)</Text>
              <View style={styles.zoneBar}>
                {(['zone1', 'zone2', 'zone3'] as const).map((z) => {
                  const pct = (zones[z] / totalZoneSeconds) * 100;
                  if (pct <= 0) return null;
                  return (
                    <View
                      key={z}
                      style={{ flex: pct, backgroundColor: zoneColors[z] }}
                    />
                  );
                })}
              </View>
              <View style={styles.zoneLegendRow}>
                {(['zone1', 'zone2', 'zone3'] as const).map((z) => (
                  <View key={z} style={styles.zoneLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: zoneColors[z] }]} />
                    <Text style={styles.zoneLegendText}>
                      {zoneLabels[z]} {formatDuration(zones[z])}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>경로</Text>
            <RouteMap coordinates={session.coordinates} mode={session.mode} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  heroBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  heroDistance: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 60,
  },
  heroDistanceUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    gap: 2,
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  zoneBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    marginBottom: 12,
  },
  zoneLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  zoneLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneLegendText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
