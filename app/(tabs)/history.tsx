import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SummaryModal from '../../src/components/SummaryModal';
import { deleteSession, getSessions } from '../../src/lib/storage';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/geo';
import { colors, modeMeta, radii, shadow } from '../../src/theme';
import type { RunSession } from '../../src/types';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<RunSession[]>([]);
  const [selected, setSelected] = useState<RunSession | null>(null);

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
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
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
        renderItem={({ item }) => {
          const meta = modeMeta[item.mode];
          return (
            <Pressable style={styles.sessionCard} onPress={() => setSelected(item)}>
              <View style={styles.modeIconWrap}>
                <Ionicons name={meta.icon} size={20} color={colors.gradientStart} />
              </View>
              <View style={styles.sessionBody}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionMode}>{meta.label}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(item.startTime).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStatText}>{formatDistanceKm(item.distance)} km</Text>
                  <Text style={styles.sessionStatDot}>·</Text>
                  <Text style={styles.sessionStatText}>{formatDuration(item.duration)}</Text>
                  <Text style={styles.sessionStatDot}>·</Text>
                  <Text style={styles.sessionStatText}>{formatPace(item.pace)} /km</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleDelete(item.id)}
                style={styles.deleteButton}
                hitSlop={10}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <SummaryModal visible={selected != null} session={selected} onClose={() => setSelected(null)} />
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
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  modeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBody: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionMode: {
    fontWeight: '700',
    color: colors.text,
  },
  sessionDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sessionStatDot: {
    color: colors.textMuted,
  },
  deleteButton: {
    padding: 6,
  },
});
