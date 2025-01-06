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
import { putUserPrayer } from '@/store/userPrayersSlice';
import { CreateUserPrayerRequest } from '@/util/createUserPrayer.types';
import { useNavigation, useRoute } from '@react-navigation/native';

import type { Prayer } from '@/util/shared.types';
import { useHeaderHeight } from '@react-navigation/elements';

interface AddPrayerProps {
  mode: 'add' | 'edit';
  prayer?: Prayer;
}

export default function AddPrayer({ mode, prayer }: AddPrayerProps) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute<{
    key: string;
    name: string;
    params: { mode: 'add' | 'edit'; prayer?: Prayer };
  }>();

  const [prayerTitle, setPrayerTitle] = useState(() => {
    if (route.params.mode === 'edit' && route.params.prayer) {
      return route.params.prayer?.title;
    }
    return '';
  });
  const [prayerDescription, setPrayerDescription] = useState(() => {
    if (route.params.mode === 'edit' && route.params.prayer) {
      return route.params.prayer?.prayerDescription;
    }
    return '';
  });
  const [isPrivate, setIsPrivate] = useState(() => {
    if (route.params.mode === 'edit' && route.params.prayer) {
      return route.params.prayer?.isPrivate;
    }
    return false;
  });

  const headerHeight = useHeaderHeight();

  navigation.setOptions({
    title: route.params.mode === 'add' ? 'Add a Prayer Request' : 'Edit Prayer Request'
  });

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

  const handleEditPrayer = useCallback(async () => {
    if (!prayerTitle.trim() || !prayerDescription.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (!route.params.prayer) {
      Alert.alert('Error', 'Failed to edit prayer. Please try again.');
      return;
    }

    const prayerData: CreateUserPrayerRequest = {
      title: prayerTitle.trim(),
      prayerDescription: prayerDescription.trim(),
      isPrivate,
      prayerType: 'general',
    };

    try {
      await dispatch(putUserPrayer(route.params.prayer!.prayerId, prayerData));
      resetForm();
      navigation.goBack(); // Close the modal/screen
    } catch (error) {
      console.error('Error editing prayer:', error);
      Alert.alert('Error', 'Something went wrong while editing the prayer.');
    }
  }, [
    prayerTitle,
    prayerDescription,
    isPrivate,
    dispatch,
    resetForm,
    navigation,
    prayer,
  ]);

  /* todo -- fix styling to be consistent with rest of app, aka add linear gradient */

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ paddingTop: headerHeight }, styles.container]}
    >
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
          onPress={
            route.params.mode === 'add' ? handleAddPrayer : handleEditPrayer
          }
          disabled={!prayerTitle || !prayerDescription}
        >
          <Text style={styles.buttonText}>
            {route.params.mode === 'add' ? 'Add' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  // contentContainer: {
  //   backgroundColor: '#fff',
  //   borderRadius: 10,
  //   padding: 20,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 4,
  //   elevation: 5,
  // },
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
    backgroundColor: '#F1FDED',
  },
  textArea: {
    height: 200,
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
