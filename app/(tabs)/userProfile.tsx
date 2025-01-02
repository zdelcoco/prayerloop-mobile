import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

export default function UserProfile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <View style={{ paddingTop: headerHeight }}>
        <Text>userProfile page</Text>
        {user && (
          <>
            <Text>Token: {token}</Text>
            <Text>User Profile Id: {user.userProfileId}</Text>
            <Text>Username: {user.username}</Text>
            <Text>Email: {user.email}</Text>
            <Text>First Name: {user.firstName}</Text>
            <Text>Last Name: {user.lastName}</Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}
