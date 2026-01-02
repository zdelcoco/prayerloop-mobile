import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

export type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
  iconType?: 'fontawesome' | 'ionicons';
};

interface HeaderDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const ACTIVE_GREEN = '#2E7D32';
const DARK_TEXT = '#2d3e31';

export default function HeaderDropdown({
  options,
  selectedValue,
  onSelect,
}: HeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const titleRef = useRef<View>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [isOpen]);

  const handlePress = () => {
    if (!isOpen && titleRef.current) {
      titleRef.current.measureInWindow((x, y, width, height) => {
        setDropdownPosition({
          top: y + height + 4,
          left: x,
        });
        setIsOpen(true);
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <>
      <Pressable
        ref={titleRef}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.titleContainer,
          pressed && styles.titleContainerPressed,
        ]}
      >
        <Text style={styles.titleText}>{selectedOption?.label || ''}</Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-down" size={18} color={DARK_TEXT} />
        </Animated.View>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownContainer,
                  {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                  },
                ]}
              >
                {options.map((option, index) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      index === 0 && styles.dropdownItemFirst,
                      index === options.length - 1 && styles.dropdownItemLast,
                      pressed && styles.dropdownItemPressed,
                    ]}
                  >
                    {option.icon && (
                      <View style={styles.iconContainer}>
                        {option.iconType === 'ionicons' ? (
                          <Ionicons name={option.icon as any} size={16} color={DARK_TEXT} />
                        ) : (
                          <FontAwesome name={option.icon as any} size={16} color={DARK_TEXT} />
                        )}
                      </View>
                    )}
                    <Text style={styles.dropdownItemText}>
                      {option.label}
                    </Text>
                    {option.value === selectedValue ? (
                      <View style={styles.selectedDot} />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </Pressable>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    backgroundColor: '#ccf0ccff',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 220,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dotPlaceholder: {
    height: 10,
    width: 10,
  },
  dropdownItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dropdownItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dropdownItemPressed: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  dropdownItemText: {
    color: DARK_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  modalOverlay: {
    flex: 1,
  },
  selectedDot: {
    backgroundColor: ACTIVE_GREEN,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingRight: 4,
    paddingVertical: 4,
  },
  titleContainerPressed: {
    opacity: 0.7,
  },
  titleText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 21.6, // ms(18) from _layout.tsx
  },
});
