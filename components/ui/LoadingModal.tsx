import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Modal from 'react-native-modal';

interface LoadingModalProps {
  visible: boolean;
  message?: string;
  onClose: () => void;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  visible,
  message,
  onClose,
}) => {
  return (
    <Modal
      isVisible={visible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0.75}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      swipeDirection={undefined}
      statusBarTranslucent={false}
    >
      <View style={styles.container}>
        <View style={styles.extraLargeSpinner}>
          <ActivityIndicator size="large" color="#b2d8b2" />
        </View>
        {message && <Text style={styles.text}>{message}</Text>}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    paddingBottom: 30,
    paddingHorizontal: 60,
    paddingTop: 48,
  },
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  text: {
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 24,
    marginTop: 48,
  },
});

export default LoadingModal;
