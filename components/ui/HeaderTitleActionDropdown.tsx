import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ActionOption = {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

interface HeaderTitleActionDropdownProps {
  title: string;
  options: ActionOption[];
  onSelect: (value: string) => void;
  maxWidth?: number;
}

const DARK_TEXT = '#2d3e31';
const ACTIVE_GREEN = '#2E7D32';

export default function HeaderTitleActionDropdown({
  title,
  options,
  onSelect,
  maxWidth,
}: HeaderTitleActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const titleRef = useRef<View>(null);

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
    setIsOpen(false);
    // Small delay to allow dropdown to close before navigation
    setTimeout(() => {
      onSelect(value);
    }, 100);
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
          maxWidth ? { maxWidth } : undefined,
          pressed ? styles.titleContainerPressed : undefined,
        ]}
      >
        <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotation }], flexShrink: 0 }}>
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
                      <Ionicons name={option.icon} size={18} color={ACTIVE_GREEN} />
                    )}
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
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
    minWidth: 200,
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
    paddingVertical: 14,
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
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
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
    flexShrink: 1,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 21.6, // ms(18) from _layout.tsx
  },
});
