import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearGeminiApiKey, getGeminiApiKey, setGeminiApiKey } from '../../src/lib/apiKeyStore';
import { colors, radii, shadow } from '../../src/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGeminiApiKey().then((value) => {
      if (value) {
        setApiKey(value);
        setHasSavedKey(true);
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert('API 키를 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await setGeminiApiKey(trimmed);
      setHasSavedKey(true);
      Alert.alert('저장 완료', 'Gemini API 키가 저장되었습니다.');
    } catch {
      Alert.alert('저장 실패', '키를 저장하는 중 문제가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert('API 키 삭제', '저장된 API 키를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await clearGeminiApiKey();
          setApiKey('');
          setHasSavedKey(false);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>설정</Text>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="key" size={18} color={colors.gradientStart} />
          <Text style={styles.cardTitle}>Gemini API 키</Text>
        </View>
        <Text style={styles.helperText}>
          AI 코치 탭에서 대화형 코칭을 받으려면 Gemini API 키가 필요합니다. Google AI Studio
          (aistudio.google.com)에서 무료로 발급받을 수 있어요. 키는 이 기기에만 안전하게
          저장됩니다.
        </Text>

        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="AIza..."
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? '저장 중...' : '저장'}</Text>
          </Pressable>
          {hasSavedKey && (
            <Pressable style={[styles.button, styles.clearButton]} onPress={handleClear}>
              <Text style={styles.clearButtonText}>삭제</Text>
            </Pressable>
          )}
        </View>

        {hasSavedKey && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.gradientStart} />
            <Text style={styles.statusText}>키가 저장되어 있습니다</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.gradientStart,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  clearButton: {
    backgroundColor: colors.surfaceMuted,
  },
  clearButtonText: {
    color: colors.danger,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
