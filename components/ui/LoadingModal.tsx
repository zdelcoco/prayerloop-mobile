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
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  container: {
    paddingTop: 48,
    paddingBottom: 30,
    paddingHorizontal: 60,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  text: {
    marginTop: 48,
    fontSize: 24,
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
  },
});

export default LoadingModal;
