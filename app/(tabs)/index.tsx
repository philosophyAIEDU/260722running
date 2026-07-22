import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SummaryModal from '../../src/components/SummaryModal';
import { useActivityTracker } from '../../src/hooks/useActivityTracker';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/geo';
import { saveSession } from '../../src/lib/storage';
import { colors, modeGradients, modeMeta, radii, shadow, shadowLg, tabBarClearance } from '../../src/theme';
import type { ActivityMode, RunSession } from '../../src/types';

const MODES: ActivityMode[] = ['running', 'walking', 'cycling'];

const GREETING: Record<ActivityMode, string> = {
  running: '오늘도 러너스 하이를 느껴보세요',
  walking: '가볍게 걸으며 리듬을 찾아보세요',
  cycling: '페달을 밟고 바람을 가르세요',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tracker = useActivityTracker();
  const [selectedMode, setSelectedMode] = useState<ActivityMode>('running');
  const [saving, setSaving] = useState(false);
  const [summarySession, setSummarySession] = useState<RunSession | null>(null);

  const isTracking = tracker.status === 'tracking';
  const activeMode = isTracking ? tracker.mode : selectedMode;
  const [gradientStart, gradientEnd] = modeGradients[activeMode];

  const liveAverageSpeed = useMemo(() => {
    if (tracker.duration === 0) return 0;
    return tracker.distance / 1000 / (tracker.duration / 3600);
  }, [tracker.distance, tracker.duration]);

  const livePace = useMemo(() => {
    if (tracker.distance === 0) return 0;
    return tracker.duration / (tracker.distance / 1000);
  }, [tracker.distance, tracker.duration]);

  const handleStart = async () => {
    try {
      await tracker.start(selectedMode);
    } catch {
      Alert.alert(
        '위치 권한 필요',
        '거리를 기록하려면 위치 권한을 허용해주세요. 설정에서 권한을 변경할 수 있습니다.'
      );
    }
  };

  const handleStop = async () => {
    const session = tracker.stop();
    if (!session) return;

    if (session.distance < 10) {
      Alert.alert('기록이 너무 짧아요', '거리가 너무 짧아 저장하지 않았습니다.');
      tracker.reset();
      return;
    }

    setSaving(true);
    try {
      await saveSession(session);
      setSummarySession(session);
    } catch {
      Alert.alert('저장 실패', '기록을 저장하는 중 문제가 발생했습니다.');
    } finally {
      setSaving(false);
      tracker.reset();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Runner's High</Text>
      <Text style={styles.greeting}>{GREETING[activeMode]}</Text>

      <View style={styles.modeRow}>
        {MODES.map((m) => {
          const meta = modeMeta[m];
          const active = selectedMode === m;
          const [mStart, mEnd] = modeGradients[m];
          return (
            <Pressable
              key={m}
              disabled={isTracking}
              onPress={() => setSelectedMode(m)}
              style={({ pressed }) => [
                styles.modeButton,
                isTracking && styles.modeButtonDisabled,
                pressed && styles.pressedScale,
              ]}
            >
              {active ? (
                <LinearGradient
                  colors={[mStart, mEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.modeButtonFill, shadow]}
                >
                  <Ionicons name={meta.icon} size={18} color="#fff" />
                  <Text style={[styles.modeButtonText, styles.modeButtonTextActive]}>
                    {meta.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.modeButtonFill}>
                  <Ionicons name={meta.icon} size={18} color={colors.textMuted} />
                  <Text style={styles.modeButtonText}>{meta.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, shadowLg]}
      >
        <View style={styles.heroDecorCircleLg} />
        <View style={styles.heroDecorCircleSm} />
        <Text style={styles.heroValue}>{formatDistanceKm(tracker.distance)}</Text>
        <Text style={styles.heroUnit}>km</Text>
        <View style={styles.heroDurationRow}>
          <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.heroDuration}>{formatDuration(tracker.duration)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatBlock icon="speedometer-outline" label="페이스 (분/km)" value={formatPace(livePace)} />
        <StatBlock icon="stats-chart-outline" label="평균 속도 (km/h)" value={liveAverageSpeed.toFixed(1)} />
        <StatBlock icon="flash-outline" label="현재 속도 (km/h)" value={tracker.currentSpeed.toFixed(1)} />
      </View>

      {isTracking ? (
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.stopButton, pressed && styles.pressedScale]}
          onPress={handleStop}
          disabled={saving}
        >
          <Ionicons name="square" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>{saving ? '저장 중...' : '종료'}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [styles.startButtonWrapper, pressed && styles.pressedScale]}
        >
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.actionButton, shadow]}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>시작</Text>
          </LinearGradient>
        </Pressable>
      )}

      <SummaryModal
        visible={summarySession != null}
        session={summarySession}
        onClose={() => setSummarySession(null)}
      />
    </View>
  );
}

function StatBlock({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 18,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  pressedScale: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  modeButtonFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  hero: {
    borderRadius: radii.xl,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroDecorCircleLg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -80,
    right: -60,
  },
  heroDecorCircleSm: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -50,
    left: -30,
  },
  heroValue: {
    fontSize: 58,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 62,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 14,
  },
  heroDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  heroDuration: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  startButtonWrapper: {
    marginTop: 'auto',
    marginBottom: tabBarClearance,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: radii.lg,
  },
  stopButton: {
    backgroundColor: colors.dark,
    marginTop: 'auto',
    marginBottom: tabBarClearance,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
