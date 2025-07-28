import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/store/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, StyleSheet, View, Pressable } from 'react-native';
import { RootState } from '@/store/store';

import Colors from '@/constants/Colors';

export default function TabsLayout() {
  const dispatch = useAppDispatch();
  const { prayers } = useAppSelector((state: RootState) => state.userPrayers);

  const logoutHandler = () => {
    dispatch(logout());
  };

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
          headerRight: () => (
            <FontAwesome
              name='sign-out'
              size={ms(24)}
              onPress={logoutHandler}
              style={{ marginRight: 16 }}
            />
          ),
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
              <View style={styles.headerRight}>
                <Pressable 
                  style={styles.headerButton} 
                  onPress={() => {
                    if ((global as any).cardsSetPrayerSessionVisible) {
                      (global as any).cardsSetPrayerSessionVisible(true);
                    }
                  }}
                  disabled={!prayers || prayers.length === 0}
                >
                  <FontAwesome 
                    name="child" 
                    size={ms(24)} 
                    color={(!prayers || prayers.length === 0) ? "#ccc" : "#000"} 
                  />
                </Pressable>
                <FontAwesome
                  name='sign-out'
                  size={ms(24)}
                  onPress={logoutHandler}
                  style={{ marginLeft: 16 }}
                />
              </View>
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
          }}
        />
        <Tabs.Screen
          name='groups'
          options={{
            title: 'Groups',
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome name='users' size={size} color={color} />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
