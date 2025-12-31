import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Prayer, User } from '@/util/shared.types';
import { formatPrayerDateTime } from '@/util/dateFormat';
interface CardProps {
  prayer: Prayer;
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: object;
  currentUserId?: number;
  usersLookup?: { [userProfileId: number]: User };
  showReadMore?: boolean;
  isDetailView?: boolean;
  isActive?: boolean;
}

const Card = ({
  prayer,
  children,
  onPress,
  onLongPress,
  style,
  currentUserId,
  usersLookup,
  showReadMore = false,
  isDetailView = false,
  isActive = false,
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

  const screenHeight = Dimensions.get('window').height;
  const maxCardHeight = screenHeight * 0.5;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.cardContainer,
        style,
        !isDetailView && { maxHeight: maxCardHeight },
        isActive && styles.activeCard
      ]}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {prayer.title}
          </Text>
          {prayer.isPrivate && (
            <Ionicons
              name="lock-closed"
              size={16}
              color="#666"
              style={styles.privateIcon}
            />
          )}
        </View>
        <View style={styles.content}>
          {children}
          {showReadMore && (
            <Text style={styles.readMoreText}>Tap to read more...</Text>
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.status}>
            {prayer.isAnswered
              ? `Answered ${prayer.datetimeAnswered ? formatPrayerDateTime(prayer.datetimeAnswered) : ''}`
              : ''}
          </Text>
          <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
            Created by {getCreatorText()} on {formatPrayerDateTime(prayer.datetimeCreate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  activeCard: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  card: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    elevation: 3,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  content: {
    marginBottom: 12,
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  privateIcon: {
    marginLeft: 8,
  },
  readMoreText: {
    color: '#008000',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 8,
  },
  status: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Card;
