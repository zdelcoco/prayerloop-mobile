import React from 'react';
import {
  Modal,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';

interface LoadingModalProps {
  visible: boolean;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ visible, message }) => {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
        <View style={styles.extraLargeSpinner}>
            <ActivityIndicator size="large" color="#b2d8b2" />
          </View>
          {message && <Text style={styles.text}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  container: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 60,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    marginTop: 24,
    fontSize: 24,
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
  },
});

export default LoadingModal;
