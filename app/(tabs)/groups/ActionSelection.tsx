import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';

export default function ActionSelection() {
  const navigation = useNavigation();
  const route = useRoute();
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const headerHeight = useHeaderHeight();

  const onGroupTitleChange = (text: string) => setGroupTitle(text);
  const onGroupDescriptionChange = (text: string) => setGroupDescription(text);

  const addPressHandler = () => {
    console.log('Add group');
  };

  const createGroupHandler = () => {
    router.push('/groups/GroupModal');
  };

  const cancelHandler = () => {
    router.dismiss();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* 
      
          todo!! - add notion item for checking permissions first
                   will require sending isAdmin (or other param/permission object) in login response
                   
      */}
      <Pressable onPress={createGroupHandler} style={styles.createButton}>
        <Text style={styles.buttonText}>Create Group</Text>
      </Pressable>
      <Pressable onPress={() => {}} style={styles.createButton}>
        <Text style={styles.buttonText}>Join Group</Text>
      </Pressable>
      <Pressable onPress={cancelHandler} style={styles.cancelButton}>
        <Text style={styles.buttonText}>Cancel</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
  },
  createButton: {
    backgroundColor: '#008000',
    marginVertical: 10,
    marginHorizontal: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    marginVertical: 10,
    marginHorizontal: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
