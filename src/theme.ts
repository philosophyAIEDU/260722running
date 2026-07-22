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

// Two-stop gradients used for the mode selector, hero card, and history accents.
// Both stops per pair are kept mid-to-dark so white text stays legible throughout.
export const modeGradients: Record<ActivityMode, [string, string]> = {
  running: ['#FF6B35', '#F72585'],
  walking: ['#0BA360', '#3CBA92'],
  cycling: ['#1488CC', '#2B32B2'],
};

export const modeSolid: Record<ActivityMode, string> = {
  running: '#FF6B35',
  walking: '#0BA360',
  cycling: '#1488CC',
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  shadowColor: '#171512',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
} as const;

// Space to reserve at the bottom of scrollable/absolute content so it clears
// the floating tab bar (68 height + 20 bottom margin + breathing room).
export const tabBarClearance = 108;

export const shadowLg = {
  shadowColor: '#171512',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.16,
  shadowRadius: 28,
  elevation: 10,
} as const;
