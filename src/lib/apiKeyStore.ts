import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore keys may only contain alphanumeric characters, ".", "-", and "_".
const GEMINI_API_KEY = 'runners-high.gemini-api-key';

// expo-secure-store has no web implementation (calling it throws at runtime),
// so the web build falls back to AsyncStorage there.
const isWeb = Platform.OS === 'web';

export async function getGeminiApiKey(): Promise<string | null> {
  return isWeb ? AsyncStorage.getItem(GEMINI_API_KEY) : SecureStore.getItemAsync(GEMINI_API_KEY);
}

export async function setGeminiApiKey(value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(GEMINI_API_KEY, value);
  } else {
    await SecureStore.setItemAsync(GEMINI_API_KEY, value);
  }
}

export async function clearGeminiApiKey(): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(GEMINI_API_KEY);
  } else {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY);
  }
}
