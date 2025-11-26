import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
  PanResponder,
  Animated,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch } from '@/hooks/redux';
import { logout } from '@/store/authSlice';

export interface ContextMenuOption {
  title: string;
  action: () => void;
  style?: 'default' | 'destructive' | 'primary' | 'blue';
}

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: ContextMenuOption[];
}

export default function ContextMenu({ visible, onClose, title, options }: ContextMenuProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const currentValue = useRef(0);

  // Animate in when modal opens
  React.useEffect(() => {
    if (visible) {
      // Start from bottom and slide up
      translateY.setValue(500);
      currentValue.current = 0;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible, translateY]);

  // Track the current value
  React.useEffect(() => {
    const listener = translateY.addListener(({ value }) => {
      currentValue.current = value;
    });

    return () => {
      translateY.removeListener(listener);
    };
  }, [translateY]);

  const handleBackdropPress = () => {
    onClose();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical drags
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Store the starting position
        translateY.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow dragging down (positive dy values)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If dragged down more than 100px or with high velocity, dismiss
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Animate out and close
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          // Snap back to top
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Don't render the modal at all if not visible
  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
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
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              
              {options.map((option, index) => (
                <Pressable 
                  key={index}
                  onPress={() => {
                    onClose();
                    // Use setTimeout to ensure the context menu fully closes before executing the action
                    setTimeout(() => {
                      option.action();
                    }, 100);
                  }} 
                  style={[
                    styles.button,
                    option.style === 'destructive' ? styles.destructiveButton :
                    option.style === 'primary' ? styles.primaryButton :
                    option.style === 'blue' ? styles.blueButton :
                    styles.defaultButton
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    option.style === 'destructive' ? styles.destructiveText :
                    option.style === 'primary' ? styles.primaryText :
                    option.style === 'blue' ? styles.blueText :
                    styles.defaultText
                  ]}>
                    {option.title}
                  </Text>
                </Pressable>
              ))}
              
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
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
  blueButton: {
    backgroundColor: '#007bff',
  },
  blueText: {
    color: '#fff',
  },
  bottomSheet: {
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    // Ensure it's always positioned correctly
    position: 'relative',
  },
  button: {
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
    paddingTop: 10,
  },
  defaultButton: {
    backgroundColor: '#90c590',
  },
  defaultText: {
    color: '#333',
  },
  destructiveButton: {
    backgroundColor: '#ef606fff',
  },
  destructiveText: {
    color: '#fff',
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
  primaryButton: {
    backgroundColor: '#008000',
  },
  primaryText: {
    color: '#fff',
  },
  safeArea: {
    paddingBottom: 20,
  },
  title: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});