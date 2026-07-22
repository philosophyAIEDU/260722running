import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SummaryModal from '../../src/components/SummaryModal';
import { deleteSession, getSessions } from '../../src/lib/storage';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/geo';
import { colors, modeMeta, modeSolid, radii, shadow, tabBarClearance } from '../../src/theme';
import type { ActivityMode, RunSession } from '../../src/types';

const MODE_ORDER: ActivityMode[] = ['running', 'walking', 'cycling'];

interface ModeSection {
  mode: ActivityMode;
  data: RunSession[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<RunSession[]>([]);
  const [selected, setSelected] = useState<RunSession | null>(null);

  const load = useCallback(() => {
    getSessions().then(setSessions);
  }, []);

  useFocusEffect(load);

  const sections = useMemo<ModeSection[]>(
    () => MODE_ORDER.map((mode) => ({ mode, data: sessions.filter((s) => s.mode === mode) })),
    [sessions]
  );

  const overall = useMemo(() => {
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

      <View style={[styles.summaryRow, shadow]}>
        <SummaryBlock icon="map-outline" label="총 거리 (km)" value={formatDistanceKm(overall.totalDistance)} />
        <View style={styles.summaryDivider} />
        <SummaryBlock icon="flag-outline" label="횟수" value={String(overall.count)} />
        <View style={styles.summaryDivider} />
        <SummaryBlock icon="speedometer-outline" label="평균 페이스" value={formatPace(overall.avgPace)} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarClearance }]}
        renderSectionHeader={({ section }) => {
          const meta = modeMeta[section.mode];
          const accent = modeSolid[section.mode];
          const totalDistance = section.data.reduce((sum, s) => sum + s.distance, 0);
          const totalDuration = section.data.reduce((sum, s) => sum + s.duration, 0);
          const avgPace = totalDistance > 0 ? totalDuration / (totalDistance / 1000) : 0;
          return (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTop}>
                <View style={[styles.modeIconWrap, { backgroundColor: `${accent}1F` }]}>
                  <Ionicons name={meta.icon} size={18} color={accent} />
                </View>
                <Text style={styles.sectionTitle}>{meta.label}</Text>
                <Text style={styles.sectionCount}>{section.data.length}회</Text>
              </View>
              {section.data.length > 0 && (
                <Text style={styles.sectionStatsText}>
                  {formatDistanceKm(totalDistance)} km · {formatPace(avgPace)} /km 평균
                </Text>
              )}
            </View>
          );
        }}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text style={styles.sectionEmptyText}>아직 {modeMeta[section.mode].label} 기록이 없어요.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const accent = modeSolid[item.mode];
          return (
            <Pressable
              style={({ pressed }) => [styles.sessionCard, shadow, pressed && styles.pressedScale]}
              onPress={() => setSelected(item)}
            >
              <View style={[styles.accentBar, { backgroundColor: accent }]} />
              <View style={styles.sessionBody}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionDate}>
                    {new Date(item.startTime).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
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
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
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

function SummaryBlock({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryBlock}>
      <Ionicons name={icon} size={15} color={colors.textMuted} style={{ marginBottom: 4 }} />
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: colors.text,
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.bg,
  },
  sectionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sectionStatsText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginLeft: 50,
  },
  sectionEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 50,
    marginBottom: 20,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingRight: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  modeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBody: {
    flex: 1,
    paddingLeft: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sessionStatDot: {
    color: colors.textMuted,
  },
  chevron: {
    marginRight: 2,
  },
  deleteButton: {
    padding: 6,
  },
});
