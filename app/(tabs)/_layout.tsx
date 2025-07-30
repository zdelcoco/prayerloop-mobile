import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppSelector } from '@/hooks/redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, StyleSheet } from 'react-native';
import { RootState } from '@/store/store';
import ContextMenuButton from '@/components/ui/ContextMenuButton';

import Colors from '@/constants/Colors';

export default function TabsLayout() {
  const { prayers } = useAppSelector((state: RootState) => state.userPrayers);

  function ms(size: number): number {
    const scale = 1.2;
    return Math.round(size * scale);
  }
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerBackground: () => (
            <LinearGradient
              colors={['#90c590', '#ffffff']}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: SCREEN_HEIGHT }}
            />
          ),
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: ms(18),
            fontFamily: 'InstrumentSans-Bold',
          },
          tabBarInactiveTintColor: Colors.light.tabIconDefault,
          tabBarActiveTintColor: Colors.light.tabIconSelected,
        }}
      >
        <Tabs.Screen
          name='cards'
          options={{
            title: 'Prayer Cards',
            tabBarLabel: 'Cards',
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome name='vcard' size={size} color={color} />
            ),
            headerRight: () => (
              <ContextMenuButton type="cards" prayerCount={prayers?.length || 0} iconSize={ms(20)} />
            ),
          }}
        />
        <Tabs.Screen
          name='userProfile'
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome name='home' size={size} color={color} />
            ),
            headerRight: () => (
              <ContextMenuButton type="home" iconSize={ms(20)} />
            ),
          }}
        />
        <Tabs.Screen
          name='groups'
          options={{
            title: 'Groups',
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome name='users' size={size} color={color} />
            ),
            headerRight: () => (
              <ContextMenuButton type="groups" iconSize={ms(20)} />
            ),
          }}
        />
      </Tabs>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
