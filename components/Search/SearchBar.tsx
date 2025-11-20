import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onFilterPress,
  placeholder = 'Search prayers...',
}) => {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={onFilterPress}
        style={({ pressed }) => [
          styles.filterButton,
          pressed && styles.filterButtonPressed,
        ]}
      >
        <Ionicons name="filter" size={24} color="#008000" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    marginLeft: 4,
    padding: 4,
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  filterButtonPressed: {
    opacity: 0.6,
  },
  input: {
    color: '#000',
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 12,
  },
});

export default SearchBar;
