import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SummaryModal from '../../src/components/SummaryModal';
import { useActivityTracker } from '../../src/hooks/useActivityTracker';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/geo';
import { saveSession } from '../../src/lib/storage';
import { colors, modeMeta, radii, shadow } from '../../src/theme';
import type { ActivityMode, RunSession } from '../../src/types';

const MODES: ActivityMode[] = ['running', 'walking', 'cycling'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tracker = useActivityTracker();
  const [selectedMode, setSelectedMode] = useState<ActivityMode>('running');
  const [saving, setSaving] = useState(false);
  const [summarySession, setSummarySession] = useState<RunSession | null>(null);

  const isTracking = tracker.status === 'tracking';

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
      <Text style={styles.title}>runner's high</Text>

      <View style={styles.modeRow}>
        {MODES.map((m) => {
          const meta = modeMeta[m];
          const active = selectedMode === m;
          return (
            <Pressable
              key={m}
              disabled={isTracking}
              onPress={() => setSelectedMode(m)}
              style={[styles.modeButton, isTracking && styles.modeButtonDisabled]}
            >
              {active ? (
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modeButtonFill}
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
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroValue}>{formatDistanceKm(tracker.distance)}</Text>
        <Text style={styles.heroUnit}>km</Text>
        <Text style={styles.heroDuration}>{formatDuration(tracker.duration)}</Text>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatBlock label="페이스 (분/km)" value={formatPace(livePace)} />
        <StatBlock label="평균 속도 (km/h)" value={liveAverageSpeed.toFixed(1)} />
        <StatBlock label="현재 속도 (km/h)" value={tracker.currentSpeed.toFixed(1)} />
      </View>

      {isTracking ? (
        <Pressable style={[styles.actionButton, styles.stopButton]} onPress={handleStop} disabled={saving}>
          <Text style={styles.actionButtonText}>{saving ? '저장 중...' : '종료'}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={handleStart} style={styles.startButtonWrapper}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
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

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: colors.text,
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
  modeButtonFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
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
    borderRadius: radii.lg,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
    ...shadow,
  },
  heroValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 60,
  },
  heroUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  heroDuration: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  startButtonWrapper: {
    marginTop: 'auto',
    marginBottom: 24,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: colors.dark,
    marginTop: 'auto',
    marginBottom: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
