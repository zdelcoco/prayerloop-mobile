import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  LayoutChangeEvent,
  Alert,
} from 'react-native';
import { removePrayerAccess } from '@/util/removePrayerAccess';
import { useAppDispatch } from '@/hooks/redux';
import { fetchUserPrayers } from '@/store/userPrayersSlice';

import { Prayer } from '@/util/shared.types';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  PrayerModal: { mode: string, prayer: Prayer };
};

interface CardProps {
  userId: number;
  userToken: string;
  prayer: Prayer;
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
  createdDate?: string;
  setLoading: (isLoading: boolean) => void;
}

const Card = ({
  userId,
  userToken,
  prayer,
  children,
  onPress,
  style,
  setLoading,
}: CardProps) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [flipped, setFlipped] = useState(false);
  const [frontHeight, setFrontHeight] = useState<number | undefined>(undefined);
  const [backHeight, setBackHeight] = useState<number | undefined>(undefined);
  const animatedValue = useState(new Animated.Value(0))[0];
  const dispatch = useAppDispatch();

  const flipCard = () => {
    Animated.timing(animatedValue, {
      toValue: flipped ? 0 : 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start(() => setFlipped(!flipped));
  };

  const handleFrontLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setFrontHeight(height);
  };

  const handleBackLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setBackHeight(height);
  };

  const onEditHandler = () => {
    flipCard();
    navigation.navigate('PrayerModal', { mode: 'edit', prayer });
  }

  const onDeleteHandler = async () => {
    try {
      setLoading(true);
      const result = await removePrayerAccess(
        userToken,
        prayer.prayerId,
        prayer.prayerAccessId
      );
      if (result.success) {
        dispatch(fetchUserPrayers());
        Alert.alert('Success', 'Prayer deleted successfully.');
      } else {
        Alert.alert(
          'Error',
          result.error?.message || 'Failed to delete prayer.'
        );
      }
    } catch (error) {
      console.error('Error deleting prayer:', error);
      Alert.alert('Error', 'An unknown error occurred.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const maxHeight = Math.max(frontHeight || 0, backHeight || 0);

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
    backfaceVisibility: 'hidden' as const,
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
    backfaceVisibility: 'hidden' as const,
  };

  const onPressHandler = () => {
    console.log('Card pressed', prayer.prayerId);
  };

  const canEditAndDelete = () => {
    return userId === prayer.userProfileId;
  };

  return (
    <Pressable
      onPress={onPressHandler}
      onLongPress={flipCard}
      style={[styles.cardContainer, style]}
    >
      <View style={[styles.cardWrapper, { height: maxHeight || 'auto' }]}>
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            { height: maxHeight || 'auto' },
            frontAnimatedStyle,
          ]}
          onLayout={handleFrontLayout} // Measure height of the front
          pointerEvents={flipped ? 'none' : 'auto'}
        >
          <Text style={styles.title}>{prayer.title}</Text>
          <View style={styles.content}>{children}</View>
          <View style={styles.footer}>
            <Text style={styles.status}>
              {prayer.isAnswered ? 'Answered?' : ''}
            </Text>
            <Text style={styles.date}>Created {prayer.datetimeCreate}</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { height: maxHeight || 'auto' },
            backAnimatedStyle,
          ]}
          onLayout={handleBackLayout} // Measure height of the back
          pointerEvents={flipped ? 'auto' : 'none'}
        >
          <View style={styles.buttonRow}>
            {canEditAndDelete() ? (
              <>
                <Pressable
                  style={styles.button}
                  onPress={onEditHandler}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.deleteButton]}
                  onPress={onDeleteHandler}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </Pressable>
              </>
            ) : (<Text>Prayer can only be edited/deleted by the prayer's creator.</Text>)}
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#F1FDED',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    width: '100%',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
    backgroundColor: '#f9fded',
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#008000',
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: '#cc0000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Card;
