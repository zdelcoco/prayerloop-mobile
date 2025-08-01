import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';

interface GroupCardProps {
  title: string;
  description: string;
  members: string;
  onPress: () => void;
  style?: object;
}

const GroupCard = ({ title, description, members, onPress, style }: GroupCardProps) => {
  const animatedValue = new Animated.Value(0);

  return (
    <Pressable onPress={onPress} style={[styles.cardContainer, style]}>
      <Animated.View style={[styles.card]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.members} numberOfLines={1} ellipsizeMode="tail">
          Members: {members}
        </Text>
      </Animated.View>
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  members: {
    fontSize: 12,
    color: '#999',
  },
});

export default GroupCard;
