import type { ActivityMode } from './types';
import type { SpeedZone } from './lib/geo';

export const colors = {
  bg: '#0B0C0F',
  surface: '#16181D',
  surfaceMuted: '#1F2228',
  text: '#F2F2F0',
  textMuted: '#8E9198',
  border: 'rgba(255,255,255,0.08)',
  gradientStart: '#EA580C',
  gradientEnd: '#BE123C',
  dark: '#0B0C0F',
  stop: '#DC2626',
  danger: '#F87171',
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
// Deep, muted jewel tones (not bright/candy) so they read as professional on a
// near-black background, while still staying distinguishable per mode.
export const modeGradients: Record<ActivityMode, [string, string]> = {
  running: ['#EA580C', '#BE123C'],
  walking: ['#0F766E', '#134E4A'],
  cycling: ['#1D4ED8', '#1E3A8A'],
};

export const modeSolid: Record<ActivityMode, string> = {
  running: '#EA580C',
  walking: '#0F766E',
  cycling: '#3B82F6',
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

// Shadows barely read on a dark background, so cards lean on a hairline
// border (colors.border) for definition; these stay as a subtle assist.
export const shadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 4,
} as const;

export const shadowLg = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.4,
  shadowRadius: 28,
  elevation: 10,
} as const;

// Space to reserve at the bottom of scrollable/absolute content so it clears
// the floating tab bar (68 height + 20 bottom margin + breathing room).
export const tabBarClearance = 108;
