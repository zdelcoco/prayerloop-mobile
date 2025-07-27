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
import { useNavigation, useRoute } from '@react-navigation/native';
import { addGroup } from '@/store/groupsSlice';
import { useAppDispatch } from '@/hooks/redux';

import { CreateGroupRequest } from '@/util/createGroup.types';

export default function GroupModal() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute();
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
    console.log('Add group');

    if (!groupTitle || !groupDescription) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    console.log('Creating group with title:', groupTitle);

    const newGroup: CreateGroupRequest = {
      groupName: groupTitle,
      groupDescription: groupDescription,
    };

    console.log('New group data:', newGroup);

    try {
      await dispatch(addGroup(newGroup));
      resetForm();
      Alert.alert('Success', 'Group created successfully!');
      // todo: Navigate to the new group 
      navigation.goBack(); // Close the modal/screen
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert('Error', 'Something went wrong while adding the group.');
    }
  }, [dispatch, groupDescription, groupTitle]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ paddingTop: headerHeight }, styles.container]}
    >
      <TextInput
        style={styles.input}
        placeholder='Enter group title'
        placeholderTextColor='#888'
        value={groupTitle}
        onChangeText={onGroupTitleChange}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder='Enter group description'
        placeholderTextColor='#888'
        value={groupDescription}
        onChangeText={onGroupDescriptionChange}
        multiline
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
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
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
