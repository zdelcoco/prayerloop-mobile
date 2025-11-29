import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ContextMenu from './ContextMenu';
import { useContextMenu, type ContextMenuType } from '@/hooks/useContextMenu';

// Dark color for icons (matches tab bar)
const DARK_ICON = '#2d3e31';

interface ContextMenuButtonProps {
  type: ContextMenuType;
  groupId?: number;
  groupName?: string;
  prayerCount?: number;
  groupCreatorId?: number;
  iconColor?: string;
  iconSize?: number;
  showCircle?: boolean;
}

export default function ContextMenuButton({
  type,
  groupId,
  groupName,
  prayerCount = 0,
  groupCreatorId,
  iconColor = DARK_ICON,
  iconSize = 24,
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

  return (
    <>
      <Pressable
        onPress={handleMenuPress}
        style={({ pressed }) => [
          showCircle ? styles.circleButton : styles.plainButton,
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
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#2d3e31',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  circleButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)', // Muted green with transparency
  },
  plainButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});