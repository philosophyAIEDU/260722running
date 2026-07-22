import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteSession, getSessions } from '../../src/lib/storage';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/geo';
import type { ActivityMode, RunSession } from '../../src/types';

const MODE_LABEL: Record<ActivityMode, string> = {
  running: '러닝',
  walking: '산책',
  cycling: '자전거',
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<RunSession[]>([]);

  const load = useCallback(() => {
    getSessions().then(setSessions);
  }, []);

  useFocusEffect(load);

  const summary = useMemo(() => {
    const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgPace = totalDistance > 0 ? totalDuration / (totalDistance / 1000) : 0;
    return { totalDistance, count: sessions.length, avgPace };
  }, [sessions]);

  const handleDelete = (id: string) => {
    Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>히스토리</Text>

      <View style={styles.summaryRow}>
        <SummaryBlock label="총 거리 (km)" value={formatDistanceKm(summary.totalDistance)} />
        <SummaryBlock label="횟수" value={String(summary.count)} />
        <SummaryBlock label="평균 페이스" value={formatPace(summary.avgPace)} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>아직 기록이 없습니다. 홈 탭에서 활동을 시작해보세요.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionMode}>{MODE_LABEL[item.mode]}</Text>
              <Text style={styles.sessionDate}>
                {new Date(item.startTime).toLocaleString('ko-KR')}
              </Text>
            </View>
            <View style={styles.sessionStats}>
              <Text style={styles.sessionStatText}>{formatDistanceKm(item.distance)} km</Text>
              <Text style={styles.sessionStatText}>{formatDuration(item.duration)}</Text>
              <Text style={styles.sessionStatText}>{formatPace(item.pace)} /km</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>삭제</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryBlock}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  sessionCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionMode: {
    fontWeight: '700',
    color: '#FF6B35',
  },
  sessionDate: {
    color: '#888',
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  sessionStatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#C0392B',
    fontSize: 13,
  },
});
