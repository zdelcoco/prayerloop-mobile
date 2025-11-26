import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
} from 'react-native';
import { router } from 'expo-router';

export default function ActionSelection() {
  const translateY = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  const createGroupHandler = () => {
    router.push('/groups/GroupModal');
  };

  const joinGroupHandler = () => {
    router.push('/groups/JoinGroupModal');
  };

  const cancelHandler = () => {
    router.dismiss();
  };

  const handleBackdropPress = () => {
    router.dismiss();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical drags on the handle area
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Set offset to current value when gesture starts
        translateY.setOffset(currentOffset.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.flattenOffset();

        // If dragged down more than 100px or with high velocity, dismiss
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          router.dismiss();
        } else {
          // Snap back to position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start(() => {
            currentOffset.current = 0;
          });
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Group Actions</Text>

          <Pressable onPress={createGroupHandler} style={styles.createButton}>
            <Text style={styles.buttonText}>Create Group</Text>
          </Pressable>

          <Pressable onPress={joinGroupHandler} style={styles.createButton}>
            <Text style={styles.buttonText}>Join Group</Text>
          </Pressable>

          <Pressable onPress={cancelHandler} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomSheet: {
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    maxHeight: screenHeight * 0.4,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    elevation: 3,
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  container: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  createButton: {
    backgroundColor: '#008000',
    borderRadius: 10,
    elevation: 3,
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  handle: {
    backgroundColor: '#ccc',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});