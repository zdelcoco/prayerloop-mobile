import { View, Text, StyleSheet, Pressable } from 'react-native';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
  answered?: boolean;
  createdDate?: string;
}

const Card = ({ title, children, onPress, style, answered, createdDate }: CardProps) => {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, style]}>
        {title && (
          <Text style={styles.title}>{title}</Text>
        )}
        <View style={styles.content}>
          {children}
        </View>
        <View style={styles.footer}>
          <Text style={styles.status}>
            {answered ? 'Answered?' : ''}
          </Text>
          {createdDate && (
            <Text style={styles.date}>Created {createdDate}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  }
});

export default Card;
