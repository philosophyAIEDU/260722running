import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivityTracker } from '../../src/hooks/useActivityTracker';
import { saveSession } from '../../src/lib/storage';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/geo';
import type { ActivityMode } from '../../src/types';

const MODES: { key: ActivityMode; label: string }[] = [
  { key: 'running', label: '러닝' },
  { key: 'walking', label: '산책' },
  { key: 'cycling', label: '자전거' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tracker = useActivityTracker();
  const [selectedMode, setSelectedMode] = useState<ActivityMode>('running');
  const [saving, setSaving] = useState(false);

  const isTracking = tracker.status === 'tracking';

  const liveAverageSpeed = useMemo(() => {
    if (tracker.duration === 0) return 0;
    return (tracker.distance / 1000) / (tracker.duration / 3600);
  }, [tracker.distance, tracker.duration]);

  const livePace = useMemo(() => {
    if (tracker.distance === 0) return 0;
    return tracker.duration / (tracker.distance / 1000);
  }, [tracker.distance, tracker.duration]);

  const handleStart = async () => {
    try {
      await tracker.start(selectedMode);
    } catch (err) {
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
      Alert.alert('저장 완료', '히스토리 탭에서 기록을 확인할 수 있습니다.');
    } catch (err) {
      Alert.alert('저장 실패', '기록을 저장하는 중 문제가 발생했습니다.');
    } finally {
      setSaving(false);
      tracker.reset();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>runner's high</Text>

      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            disabled={isTracking}
            onPress={() => setSelectedMode(m.key)}
            style={[
              styles.modeButton,
              selectedMode === m.key && styles.modeButtonActive,
              isTracking && styles.modeButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,
                selectedMode === m.key && styles.modeButtonTextActive,
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsGrid}>
        <StatBlock label="거리 (km)" value={formatDistanceKm(tracker.distance)} big />
        <StatBlock label="시간" value={formatDuration(tracker.duration)} big />
        <StatBlock label="페이스 (분/km)" value={formatPace(livePace)} />
        <StatBlock label="평균 속도 (km/h)" value={liveAverageSpeed.toFixed(1)} />
        <StatBlock label="현재 속도 (km/h)" value={tracker.currentSpeed.toFixed(1)} />
      </View>

      {isTracking ? (
        <Pressable style={[styles.actionButton, styles.stopButton]} onPress={handleStop} disabled={saving}>
          <Text style={styles.actionButtonText}>{saving ? '저장 중...' : '종료'}</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.actionButton, styles.startButton]} onPress={handleStart}>
          <Text style={styles.actionButtonText}>시작</Text>
        </Pressable>
      )}
    </View>
  );
}

function StatBlock({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.statBlock}>
      <Text style={big ? styles.statValueBig : styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statBlock: {
    width: '47%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statValueBig: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#FF6B35',
  },
  stopButton: {
    backgroundColor: '#333',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
