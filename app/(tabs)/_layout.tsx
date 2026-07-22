import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { ColorValue, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../src/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  color,
  focused,
}: {
  name: IoniconName;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} color={color} size={20} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gradientStart,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [styles.tabBar, { bottom: Math.max(20, insets.bottom + 8) }],
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 100}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '히스토리',
          tabBarIcon: ({ color, focused }) => <TabIcon name="time" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: '코치',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubble-ellipses" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    height: 68,
    borderRadius: radii.xl,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(22,24,29,0.75)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  item: {
    paddingTop: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(234,88,12,0.18)',
  },
});
