import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { addGroup } from '@/store/groupsSlice';
import { useAppDispatch } from '@/hooks/redux';

import { CreateGroupRequest } from '@/util/createGroup.types';

export default function GroupModal() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const headerHeight = useHeaderHeight();

  const onGroupTitleChange = (text: string) => setGroupTitle(text);
  const onGroupDescriptionChange = (text: string) => setGroupDescription(text);

  const resetForm = () => {
    setGroupTitle('');
    setGroupDescription('');
  };

  const addPressHandler = useCallback(async () => {

    if (!groupTitle || !groupDescription) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    const newGroup: CreateGroupRequest = {
      groupName: groupTitle,
      groupDescription: groupDescription,
    };

    try {
      await dispatch(addGroup(newGroup));
      resetForm();
      // Close both modals (GroupModal and ActionSelection)
      navigation.goBack(); // Close GroupModal
      setTimeout(() => {
        navigation.goBack(); // Close ActionSelection
        // Show alert after modals are closed
        setTimeout(() => {
          Alert.alert('Success', 'Prayer circle created successfully!');
        }, 100);
      }, 100);
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert('Error', 'Something went wrong while creating the prayer circle.');
    }
  }, [dispatch, groupDescription, groupTitle, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ paddingTop: headerHeight }, styles.container]}
    >
      <TextInput
        style={styles.input}
        placeholder='Enter prayer circle name'
        placeholderTextColor='#888'
        value={groupTitle}
        onChangeText={onGroupTitleChange}
        autoCapitalize="sentences"
        autoCorrect={true}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder='Enter prayer circle description'
        placeholderTextColor='#888'
        value={groupDescription}
        onChangeText={onGroupDescriptionChange}
        multiline
        autoCapitalize="sentences"
        autoCorrect={true}
      />
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.addButton]}
          onPress={addPressHandler}
          disabled={!groupTitle || !groupDescription}
        >
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#008000',
  },
  button: {
    alignItems: 'center',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  container: {
    backgroundColor: '#f9f9f9',
    flex: 1,
    padding: 20,
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
});
