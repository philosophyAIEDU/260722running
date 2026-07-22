import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGeminiApiKey } from '../../src/lib/apiKeyStore';
import { buildContextSummary } from '../../src/lib/coachContext';
import { askCoach, type ChatMessage } from '../../src/lib/gemini';
import { getSessions } from '../../src/lib/storage';
import { colors, radii } from '../../src/theme';

interface Message extends ChatMessage {
  id: string;
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      getGeminiApiKey().then((key) => setHasApiKey(!!key));
    }, [])
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      setHasApiKey(false);
      return;
    }

    const userMessage: Message = { id: `${Date.now()}-u`, role: 'user', text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const sessions = await getSessions();
      const contextSummary = buildContextSummary(sessions);
      const reply = await askCoach(apiKey, nextMessages, contextSummary);
      setMessages((prev) => [...prev, { id: `${Date.now()}-m`, role: 'model', text: reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setMessages((prev) => [...prev, { id: `${Date.now()}-e`, role: 'model', text: `⚠️ ${message}` }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  if (hasApiKey === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>AI 코치</Text>
        <View style={styles.emptyState}>
          <Ionicons name="key-outline" size={32} color={colors.gradientStart} />
          <Text style={styles.emptyTitle}>API 키가 필요해요</Text>
          <Text style={styles.emptyBody}>
            설정 탭에서 Gemini API 키를 등록하면 러닝 데이터를 바탕으로 코칭을 받을 수 있어요.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => router.push('/settings')}>
            <Text style={styles.emptyButtonText}>설정으로 이동</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>AI 코치</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.gradientStart} />
            <Text style={styles.emptyTitle}>코치에게 물어보세요</Text>
            <Text style={styles.emptyBody}>
              "이번 주 페이스가 늘고 있나요?"처럼 내 기록에 대해 자유롭게 질문해보세요.
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          item.role === 'user' ? (
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.userBubble]}
            >
              <Text style={styles.userBubbleText}>{item.text}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.modelBubble]}>
              <Text style={styles.modelBubbleText}>{item.text}</Text>
            </View>
          )
        }
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.gradientStart} />
          <Text style={styles.loadingText}>코치가 답변을 작성 중...</Text>
        </View>
      )}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="러닝에 대해 물어보세요"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerRow: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    color: colors.text,
  },
  messageList: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  userBubbleText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  modelBubbleText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.gradientStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.gradientStart,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
