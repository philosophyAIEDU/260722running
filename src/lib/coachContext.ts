import { formatDistanceKm, formatDuration, formatPace } from './geo';
import { modeMeta } from '../theme';
import type { RunSession } from '../types';

export function buildContextSummary(sessions: RunSession[]): string {
  if (sessions.length === 0) return '아직 저장된 활동 기록이 없습니다.';

  const recent = sessions.slice(0, 5);
  const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgPace = totalDistance > 0 ? totalDuration / (totalDistance / 1000) : 0;

  const lines = [
    `전체 기록 ${sessions.length}회, 총 거리 ${formatDistanceKm(totalDistance)}km, 평균 페이스 ${formatPace(avgPace)}/km`,
    '최근 활동:',
    ...recent.map((s) => {
      const date = new Date(s.startTime).toLocaleDateString('ko-KR');
      return `- ${date} ${modeMeta[s.mode].label} ${formatDistanceKm(s.distance)}km, ${formatDuration(
        s.duration
      )}, 페이스 ${formatPace(s.pace)}/km`;
    }),
  ];
  return lines.join('\n');
}
