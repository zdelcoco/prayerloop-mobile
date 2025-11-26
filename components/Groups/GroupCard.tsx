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
  onLongPress?: () => void;
  style?: object;
  isActive?: boolean;
}

const GroupCard = ({ title, description, members, onPress, onLongPress, style, isActive = false }: GroupCardProps) => {
  const animatedValue = new Animated.Value(0);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.cardContainer, style, isActive && styles.activeCard]}>
      <Animated.View style={styles.card}>
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
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  members: {
    color: '#999',
    fontSize: 12,
  },
  title: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default GroupCard;
