import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { RootState } from '@/store/store';
import { fetchUserGroups } from '@/store/groupsSlice';

import GroupCard from '@/components/Groups/GroupCard';

export default function Groups() {
  const headerHeight = useHeaderHeight();
  const screenHeight = Dimensions.get('window').height;
  const headerGradientEnd = headerHeight / screenHeight;

  const dispatch = useAppDispatch();
  const { groups, status, error } = useAppSelector(
    (state: RootState) => state.userGroups
  );
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && status === 'idle') {
      dispatch(fetchUserGroups());
    }
  }, [dispatch, user, isAuthenticated, status]);

  console.log(groups);

  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      <View style={[{ paddingTop: headerHeight }, styles.container]}>
      <FlatList
        data={groups}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <GroupCard
            title={item.groupName}
            description={item.groupDescription}
            members={'render group members here'}
            onPress={() => console.log(`Pressed: ${item.groupName}`)}
          />
        )}
      />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  text: {
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
});