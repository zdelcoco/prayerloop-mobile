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
        // Set offset to current value when gesture starts
        translateY.setOffset(currentValue.current);
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
          onClose();
        } else {
          // Snap back to position
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

  return (
    <Modal
      animationType="slide"
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
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.6,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  safeArea: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    marginVertical: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  defaultButton: {
    backgroundColor: '#90c590',
  },
  primaryButton: {
    backgroundColor: '#008000',
  },
  blueButton: {
    backgroundColor: '#007bff',
  },
  destructiveButton: {
    backgroundColor: '#ef606fff',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginVertical: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultText: {
    color: '#fff',
  },
  primaryText: {
    color: '#fff',
  },
  blueText: {
    color: '#fff',
  },
  destructiveText: {
    color: '#fff',
  },
});