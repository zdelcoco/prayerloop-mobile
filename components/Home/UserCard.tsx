import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface UserCardProps {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  onEditPress?: () => void;
}

const UserCard = ({ username, email, firstName, lastName, onEditPress }: UserCardProps) => {
  const userIcon = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.iconWrapper}>
        <Text style={styles.iconText}>{userIcon}</Text>
      </View>
      <Text style={styles.name}>{`${firstName} ${lastName}`}</Text>
      <View style={styles.details}>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Username: </Text>
          {username}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Email: </Text>
          {email}
        </Text>
        <View style={styles.placeholder}></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    backgroundColor: '#008000',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  details: {
    alignItems: 'flex-start',
    width: '100%',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
  },
  placeholder: {
    height: 8,
  },
});

export default UserCard;
