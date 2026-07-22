import type { ActivityMode } from './types';
import type { SpeedZone } from './lib/geo';

export const colors = {
  bg: '#F7F5F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F0EC',
  text: '#171512',
  textMuted: '#8A857C',
  border: 'rgba(23,21,18,0.08)',
  gradientStart: '#FF6B35',
  gradientEnd: '#F72585',
  dark: '#171512',
  danger: '#C0392B',
} as const;

export const zoneColors: Record<SpeedZone, string> = {
  zone1: '#2a78d6', // easy / slow
  zone2: '#1baf7a', // moderate
  zone3: '#eb6834', // fast / hard
};

export const zoneLabels: Record<SpeedZone, string> = {
  zone1: '여유',
  zone2: '보통',
  zone3: '빠름',
};

export const modeMeta: Record<ActivityMode, { label: string; icon: 'walk' | 'footsteps' | 'bicycle' }> = {
  running: { label: '러닝', icon: 'footsteps' },
  walking: { label: '산책', icon: 'walk' },
  cycling: { label: '자전거', icon: 'bicycle' },
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const shadow = {
  shadowColor: '#171512',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
} as const;
