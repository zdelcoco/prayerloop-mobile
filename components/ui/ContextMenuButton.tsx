import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ContextMenu from './ContextMenu';
import { useContextMenu, type ContextMenuType } from '@/hooks/useContextMenu';

// Dark color for icons
const DARK_ICON = '#2d3e31';

interface ContextMenuButtonProps {
  type: ContextMenuType;
  groupId?: number;
  groupName?: string;
  prayerCount?: number;
  groupCreatorId?: number;
  iconColor?: string;
  iconSize?: number;
  buttonSize?: number;
  showCircle?: boolean;
}

export default function ContextMenuButton({
  type,
  groupId,
  groupName,
  prayerCount = 0,
  groupCreatorId,
  iconColor = DARK_ICON,
  iconSize = 18,
  buttonSize = 36,
  showCircle = true,
}: ContextMenuButtonProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuConfig = useContextMenu({ type, groupId, groupName, prayerCount, groupCreatorId });

  const handleMenuPress = () => {
    if (menuVisible) {
      // If already open, close it
      setMenuVisible(false);
    } else {
      // If closed, open it
      setMenuVisible(true);
    }
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  const dynamicCircleStyles = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
  };

  return (
    <>
      <Pressable
        onPress={handleMenuPress}
        style={({ pressed }) => [
          showCircle ? [styles.circleButton, dynamicCircleStyles] : styles.plainButton,
          pressed && showCircle && styles.circleButtonPressed,
        ]}
      >
        <FontAwesome name="navicon" size={iconSize} color={iconColor} />
      </Pressable>

      <ContextMenu
        visible={menuVisible}
        onClose={handleMenuClose}
        title={menuConfig.title}
        options={menuConfig.options}
      />
    </>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    alignItems: 'center',
    backgroundColor: '#ccf0ccff', // Muted green - matches tab buttons
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  circleButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)', // Muted green with transparency
  },
  plainButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});