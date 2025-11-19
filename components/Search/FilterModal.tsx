import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import MainButton from '../ui/MainButton';

export interface FilterOptions {
  createdBy?: number | null; // User ID
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  isAnswered?: boolean | null;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  availableUsers?: Array<{ id: number; name: string }>; // For group prayers
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  availableUsers = [],
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters);
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      createdBy: null,
      dateRange: 'all',
      isAnswered: null,
    };
    setLocalFilters(resetFilters);
  };

  const handleCancel = () => {
    setLocalFilters(currentFilters);
    onClose();
  };

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ] as const;

  const answeredOptions = [
    { value: null, label: 'All' },
    { value: false, label: 'Active' },
    { value: true, label: 'Answered' },
  ] as const;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{ x: 1, y: 0.6 }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000" />
            </Pressable>
            <Text style={styles.title}>Filter Prayers</Text>
            <Pressable onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.formContainer}>
              {/* Created By Filter - Only show if there are multiple users */}
              {availableUsers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Created By</Text>
                  <View style={styles.optionsContainer}>
                    <Pressable
                      style={[
                        styles.option,
                        localFilters.createdBy === null && styles.optionSelected,
                      ]}
                      onPress={() =>
                        setLocalFilters({ ...localFilters, createdBy: null })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          localFilters.createdBy === null && styles.optionTextSelected,
                        ]}
                      >
                        All Users
                      </Text>
                      {localFilters.createdBy === null && (
                        <Ionicons name="checkmark" size={20} color="#008000" />
                      )}
                    </Pressable>
                    {availableUsers.map((user) => (
                      <Pressable
                        key={user.id}
                        style={[
                          styles.option,
                          localFilters.createdBy === user.id && styles.optionSelected,
                        ]}
                        onPress={() =>
                          setLocalFilters({ ...localFilters, createdBy: user.id })
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            localFilters.createdBy === user.id &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {user.name}
                        </Text>
                        {localFilters.createdBy === user.id && (
                          <Ionicons name="checkmark" size={20} color="#008000" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Date Range Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date Created</Text>
                <View style={styles.optionsContainer}>
                  {dateRangeOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.option,
                        localFilters.dateRange === option.value &&
                          styles.optionSelected,
                      ]}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          dateRange: option.value,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          localFilters.dateRange === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {localFilters.dateRange === option.value && (
                        <Ionicons name="checkmark" size={20} color="#008000" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Prayer Status Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prayer Status</Text>
                <View style={styles.optionsContainer}>
                  {answeredOptions.map((option, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.option,
                        localFilters.isAnswered === option.value &&
                          styles.optionSelected,
                      ]}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          isAnswered: option.value,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          localFilters.isAnswered === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {localFilters.isAnswered === option.value && (
                        <Ionicons name="checkmark" size={20} color="#008000" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <MainButton
              title="Apply Filters"
              onPress={handleApply}
              buttonStyle={styles.applyButton}
            />
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontFamily: 'InstrumentSans-Bold',
    color: '#000',
  },
  resetButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  resetText: {
    fontSize: 16,
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#008000',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#000',
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: 'rgba(144, 197, 144, 0.2)',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'InstrumentSans-Regular',
    color: '#333',
  },
  optionTextSelected: {
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#000',
  },
  footer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  applyButton: {
    backgroundColor: '#008000',
  },
});

export default FilterModal;
