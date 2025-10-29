import React, { useState, useCallback, useLayoutEffect } from 'react';
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
  ActivityIndicator,
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
  const [isSaving, setIsSaving] = useState(false);

  const headerHeight = useHeaderHeight();

  useLayoutEffect(() => {
    navigation.setOptions({
      title:
        route.params.mode === 'add'
          ? 'Add a Prayer Request'
          : 'Edit Prayer Request',
    });
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

    if (isSaving) {
      return; // Prevent multiple submissions
    }

    const prayerData: CreateUserPrayerRequest = {
      title: prayerTitle.trim(),
      prayerDescription: prayerDescription.trim(),
      isPrivate,
      prayerType: 'general',
    };

    setIsSaving(true);

    try {
      // Simulate network delay for testing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await dispatch(addUserPrayer(prayerData));
      resetForm();
      setIsSaving(false);
      navigation.goBack(); // Close the modal/screen
    } catch (error) {
      console.error('Error adding prayer:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Something went wrong while adding the prayer.');
    }
  }, [
    prayerTitle,
    prayerDescription,
    isPrivate,
    isSaving,
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

    if (isSaving) {
      return; // Prevent multiple submissions
    }

    const prayerData: CreateUserPrayerRequest = {
      title: prayerTitle.trim(),
      prayerDescription: prayerDescription.trim(),
      isPrivate,
      prayerType: 'general',
    };

    setIsSaving(true);

    try {
      // Simulate network delay for testing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await dispatch(putUserPrayer(route.params.prayer!.prayerId, prayerData));
      resetForm();
      setIsSaving(false);
      navigation.goBack(); // Close the modal/screen
    } catch (error) {
      console.error('Error editing prayer:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Something went wrong while editing the prayer.');
    }
  }, [
    prayerTitle,
    prayerDescription,
    isPrivate,
    isSaving,
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
          style={[
            styles.button,
            styles.addButton,
            (isSaving || !prayerTitle || !prayerDescription) && styles.disabledButton
          ]}
          onPress={
            route.params.mode === 'add' ? handleAddPrayer : handleEditPrayer
          }
          disabled={isSaving || !prayerTitle || !prayerDescription}
        >
          <Text style={styles.buttonText}>
            {route.params.mode === 'add' ? 'Add' : 'Save'}
          </Text>
        </Pressable>
      </View>

      {/* Loading Overlay */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.extraLargeSpinner}>
              <ActivityIndicator size="large" color="#b2d8b2" />
            </View>
            <Text style={styles.loadingText}>
              {route.params.mode === 'add' ? 'Saving...' : 'Updating...'}
            </Text>
          </View>
        </View>
      )}
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
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    paddingTop: 48,
    paddingBottom: 30,
    paddingHorizontal: 60,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  loadingText: {
    marginTop: 48,
    fontSize: 24,
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
  },
});
