import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import { Prayer } from '@/util/shared.types';
interface CardProps {
  prayer: Prayer;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}

const Card = ({
  prayer,
  children,
  onPress,
  style,
}: CardProps) => {

  return (
    <Pressable onPress={onPress} style={[styles.cardContainer, style]}>
      <View style={styles.card}>
        <Text style={styles.title}>{prayer.title}</Text>
        <View style={styles.content}>
          {children}
        </View>
        <View style={styles.footer}>
          <Text style={styles.status}>
            {prayer.isAnswered ? 'Answered?' : ''}
          </Text>
          <Text style={styles.date}>Created {prayer.datetimeCreate}</Text>
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
