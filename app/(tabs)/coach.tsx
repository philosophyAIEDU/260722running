import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../src/theme';

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>AI 코치</Text>
      <View style={styles.card}>
        <Ionicons name="chatbubble-ellipses" size={28} color={colors.gradientStart} />
        <Text style={styles.body}>준비 중입니다. 다음 단계에서 추가될 예정이에요.</Text>
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
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { color: colors.textMuted, textAlign: 'center' },
});
