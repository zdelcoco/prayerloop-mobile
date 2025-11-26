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
  ActivityIndicator,
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
  const [isSaving, setIsSaving] = useState(false);

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

  const addPrayer = useCallback(async () => {
    if (!prayerTitle.trim() || !prayerDescription.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (isSaving) {
      return; // Prevent multiple submissions
    }

    try {
      setIsSaving(true);
      const prayerData: CreateUserPrayerRequest = {
        title: prayerTitle.trim(),
        prayerDescription: prayerDescription.trim(),
        isPrivate,
        prayerType: 'general',
      };
      await onAddPrayer(prayerData);
      console.log('Prayer added:', prayerData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding prayer:', error);
      Alert.alert('Error', 'Something went wrong while adding the prayer.');
    } finally {
      setIsSaving(false);
    }
  }, [prayerTitle, prayerDescription, isPrivate, isSaving, onAddPrayer, onClose, resetForm]);

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
            autoCapitalize="sentences"
            autoCorrect={true}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter prayer details"
            placeholderTextColor="#888"
            value={prayerDescription}
            onChangeText={onPrayerDescriptionChange}
            multiline
            autoCapitalize="sentences"
            autoCorrect={true}
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
                (isSaving || !prayerTitle || !prayerDescription) && styles.disabledButton,
              ]}
              onPress={addPrayer}
              disabled={isSaving || !prayerTitle || !prayerDescription}
            >
              <Text style={styles.buttonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008000" />
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#008000',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#ccc',
    borderRadius: 5,
    flexGrow: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  checkboxLabel: {
    color: '#333',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '90%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
