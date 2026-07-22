import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RunSession } from '../types';

const SESSIONS_KEY = 'runners-high:sessions';

export async function getSessions(): Promise<RunSession[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RunSession[];
    return parsed.sort((a, b) => b.startTime - a.startTime);
  } catch {
    return [];
  }
}

export async function saveSession(session: RunSession): Promise<void> {
  const sessions = await getSessions();
  sessions.unshift(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  const next = sessions.filter((s) => s.id !== id);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
}
