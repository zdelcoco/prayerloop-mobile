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
        autoCorrect={true}
        autoCapitalize="sentences"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder='Enter prayer details'
        placeholderTextColor='#888'
        value={prayerDescription}
        onChangeText={onPrayerDescriptionChange}
        multiline
        autoCorrect={true}
        autoCapitalize="sentences"
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
    backgroundColor: '#f9f9f9',
    flex: 1,
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
    backgroundColor: '#F1FDED',
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
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
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  loadingContainer: {
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
  loadingText: {
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 24,
    marginTop: 48,
  },
});
