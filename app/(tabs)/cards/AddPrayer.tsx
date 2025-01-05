import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppDispatch } from '@/hooks/redux';
import { addUserPrayer } from '@/store/userPrayersSlice';
import { CreateUserPrayerRequest } from '@/util/createUserPrayer.types';
import { useNavigation } from '@react-navigation/native';

export default function AddPrayer() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerDescription, setPrayerDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const onPrayerTitleChange = useCallback(
    (text: string) => setPrayerTitle(text),
    []
  );
  const onPrayerDescriptionChange = useCallback(
    (text: string) => setPrayerDescription(text),
    []
  );
  const onIsPrivateChange = useCallback(
    (value: boolean) => setIsPrivate(value),
    []
  );

  const resetForm = useCallback(() => {
    setPrayerTitle('');
    setPrayerDescription('');
    setIsPrivate(false);
  }, []);

  const handleAddPrayer = useCallback(async () => {
    if (!prayerTitle.trim() || !prayerDescription.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const prayerData: CreateUserPrayerRequest = {
      title: prayerTitle.trim(),
      prayerDescription: prayerDescription.trim(),
      isPrivate,
      prayerType: 'general',
    };

    try {
      await dispatch(addUserPrayer(prayerData));
      resetForm();
      navigation.goBack(); // Close the modal/screen
    } catch (error) {
      console.error('Error adding prayer:', error);
      Alert.alert('Error', 'Something went wrong while adding the prayer.');
    }
  }, [
    prayerTitle,
    prayerDescription,
    isPrivate,
    dispatch,
    resetForm,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Add a New Prayer</Text>
        <TextInput
          style={styles.input}
          placeholder='Enter prayer title'
          placeholderTextColor='#888'
          value={prayerTitle}
          onChangeText={onPrayerTitleChange}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder='Enter prayer details'
          placeholderTextColor='#888'
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
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.addButton]}
            onPress={handleAddPrayer}
            disabled={!prayerTitle || !prayerDescription}
          >
            <Text style={styles.buttonText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
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
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  addButton: {
    backgroundColor: '#008000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
