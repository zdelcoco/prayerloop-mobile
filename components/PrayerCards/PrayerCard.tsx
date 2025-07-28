import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { Prayer, User } from '@/util/shared.types';
import { formatPrayerDateTime } from '@/util/dateFormat';
interface CardProps {
  prayer: Prayer;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
  currentUserId?: number;
  usersLookup?: { [userProfileId: number]: User };
}

const Card = ({
  prayer,
  children,
  onPress,
  style,
  currentUserId,
  usersLookup,
}: CardProps) => {
  
  const getCreatorText = () => {
    if (currentUserId && prayer.createdBy === currentUserId) {
      return 'you';
    }
    
    if (usersLookup && usersLookup[prayer.createdBy]) {
      return usersLookup[prayer.createdBy].firstName;
    }
    
    return 'someone';
  };

  return (
    <Pressable onPress={onPress} style={[styles.cardContainer, style]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{prayer.title}</Text>
          {prayer.isPrivate && (
            <FontAwesome 
              name="eye-slash" 
              size={16} 
              color="#666" 
              style={styles.privateIcon}
            />
          )}
        </View>
        <View style={styles.content}>
          {children}
        </View>
        <View style={styles.footer}>
          <Text style={styles.status}>
            {prayer.isAnswered ? 'Answered?' : ''}
          </Text>
          <Text style={styles.date}>Created by {getCreatorText()} on {formatPrayerDateTime(prayer.datetimeCreate)}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  privateIcon: {
    marginLeft: 8,
  },
  content: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    color: '#666',
    fontSize: 12,
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  
});

export default Card;
