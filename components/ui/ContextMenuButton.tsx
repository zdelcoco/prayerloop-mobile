import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ContextMenu from './ContextMenu';
import { useContextMenu, type ContextMenuType } from '@/hooks/useContextMenu';

interface ContextMenuButtonProps {
  type: ContextMenuType;
  groupId?: number;
  groupName?: string;
  prayerCount?: number;
  groupCreatorId?: number;
  iconColor?: string;
  iconSize?: number;
}

export default function ContextMenuButton({
  type,
  groupId,
  groupName,
  prayerCount = 0,
  groupCreatorId,
  iconColor = '#333',
  iconSize = 24
}: ContextMenuButtonProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuConfig = useContextMenu({ type, groupId, groupName, prayerCount, groupCreatorId });

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={handleMenuPress}
        style={{ 
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
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