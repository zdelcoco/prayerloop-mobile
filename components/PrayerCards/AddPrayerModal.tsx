import React, { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Switch,
  Alert,
} from 'react-native';

import { CreateUserPrayerRequest } from '@/util/createUserPrayer.types';

interface AddPrayerModalProps {
  visible: boolean;
  onAddPrayer: (prayerData: CreateUserPrayerRequest) => void;
  onClose: () => void;
}

export default function AddPrayerModal({
  visible,
  onAddPrayer,
  onClose,
}: AddPrayerModalProps) {
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerDescription, setPrayerDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const onPrayerTitleChange = useCallback((text: string) => setPrayerTitle(text), []);
  const onPrayerDescriptionChange = useCallback(
    (text: string) => setPrayerDescription(text),
    []
  );
  const onIsPrivateChange = useCallback((value: boolean) => setIsPrivate(value), []);

  const resetForm = useCallback(() => {
    setPrayerTitle('');
    setPrayerDescription('');
    setIsPrivate(false);
  }, []);

  const addPrayer = useCallback(() => {
    if (!prayerTitle.trim() || !prayerDescription.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const prayerData: CreateUserPrayerRequest = {
        title: prayerTitle.trim(),
        prayerDescription: prayerDescription.trim(),
        isPrivate,
        prayerType: 'general',
      };
      onAddPrayer(prayerData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding prayer:', error);
      Alert.alert('Error', 'Something went wrong while adding the prayer.');
    }
  }, [prayerTitle, prayerDescription, isPrivate, onAddPrayer, onClose, resetForm]);

  const cancelAddPrayer = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add a New Prayer</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter prayer title"
            placeholderTextColor="#888"
            value={prayerTitle}
            onChangeText={onPrayerTitleChange}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter prayer details"
            placeholderTextColor="#888"
            value={prayerDescription}
            onChangeText={onPrayerDescriptionChange}
            multiline
          />
          <View style={styles.checkboxContainer}>
            <Text style={styles.checkboxLabel}>Mark as Private</Text>
            <Switch
              value={isPrivate}
              onValueChange={onIsPrivateChange}
              thumbColor={isPrivate ? 'white' : 'white'}
              trackColor={{ false: '#ccc', true: '#008000' }}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={cancelAddPrayer}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.addButton,
                // (!prayerTitle || !prayerDescription) && styles.disabledButton,
              ]}
              onPress={addPrayer}
              disabled={!prayerTitle || !prayerDescription}
            >
              <Text style={styles.buttonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flexGrow: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#008000',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
