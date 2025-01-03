import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

import { Group } from '@/util/getUserGroups.types';

type GroupPrayersRouteParams = {
  group: string; // Serialized group
};

export default function GroupPrayers() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ GroupPrayers: GroupPrayersRouteParams }, 'GroupPrayers'>>();

  // Deserialize the group parameter
  const group: Group = JSON.parse(route.params.group);

  useLayoutEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        headerTitle: `${group.groupName}`,
        headerLeft: () => (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="angle-left" size={28} color="#000" />
          </TouchableOpacity>
        ),
      });
    }

    return () => {
      if (parentNavigation) {
        parentNavigation.setOptions({
          headerTitle: 'Groups',
          headerLeft: null,
        });
      }
    };
  }, [navigation, group]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Group {group.groupName}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
