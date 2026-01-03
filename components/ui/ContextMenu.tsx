import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';

export interface ContextMenuOption {
  title: string;
  action: () => void;
  style?: 'default' | 'destructive' | 'primary' | 'blue';
  icon?: string;
}

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: ContextMenuOption[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PANEL_WIDTH = screenWidth * 0.7;

// Design language colors (matching _layout.tsx)
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';

// Icon mapping for menu options
const getIconForOption = (title: string, style?: string): string => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('prayer session')) return 'play-circle';
  if (titleLower.includes('add prayer')) return 'plus-circle';
  if (titleLower.includes('user preferences') || titleLower.includes('preferences')) return 'cog';
  if (titleLower.includes('logout')) return 'sign-out';
  if (titleLower.includes('create group')) return 'plus-square';
  if (titleLower.includes('join group')) return 'user-plus';
  if (titleLower.includes('manage group')) return 'users';
  if (titleLower.includes('invite')) return 'share';
  if (titleLower.includes('view cards')) return 'vcard';
  if (titleLower.includes('view groups')) return 'users';
  if (style === 'destructive') return 'sign-out';
  return 'chevron-right';
};

// Get text/icon colors based on style
const getItemColors = (style?: string) => {
  switch (style) {
    case 'destructive':
      return { text: '#ad2835ff', icon: '#ad2835ff' };
    case 'blue':
      return { text: '#007bff', icon: '#007bff' };
    default:
      return { text: DARK_TEXT, icon: DARK_TEXT };
  }
};

export default function ContextMenu({ visible, onClose, title, options }: ContextMenuProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      translateX.setValue(-PANEL_WIDTH);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -PANEL_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
          const progress = Math.abs(gestureState.dx) / PANEL_WIDTH;
          backdropOpacity.setValue(1 - progress);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -80 || gestureState.vx < -0.5) {
          animateOut();
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={animateOut}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={animateOut}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity }
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sidePanel,
            { transform: [{ translateX }] },
          ]}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={['#90C590', '#F6EDD9']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.title}>{title}</Text>
            </View>

            {/* Menu Options */}
            <View style={styles.optionsContainer}>
              {options.map((option, index) => {
                const colors = getItemColors(option.style);
                const icon = option.icon || getIconForOption(option.title, option.style);

                return (
                  <View key={index} style={styles.cardWrapper}>
                    <Pressable
                      onPress={() => {
                        animateOut();
                        setTimeout(() => {
                          option.action();
                        }, 250);
                      }}
                      style={({ pressed }) => [
                        styles.card,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.cardContent}>
                        <FontAwesome
                          name={icon as any}
                          size={18}
                          color={colors.icon}
                          style={styles.menuIcon}
                        />
                        <Text style={[styles.menuItemText, { color: colors.text }]}>
                          {option.title}
                        </Text>
                        <FontAwesome
                          name="chevron-right"
                          size={14}
                          color={colors.icon}
                          style={styles.chevron}
                        />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable
                onPress={animateOut}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <FontAwesome name="times" size={16} color={DARK_TEXT} />
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardPressed: {
    backgroundColor: 'rgba(144, 197, 144, 0.4)',
  },
  cardWrapper: {
    marginBottom: 8,
  },
  chevron: {
    opacity: 0.5,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.7)',
  },
  closeText: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 15,
  },
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  footer: {
    borderTopColor: 'rgba(45, 62, 49, 0.1)',
    borderTopWidth: 1,
    marginTop: 'auto',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  gradient: {
    flex: 1,
  },
  header: {
    borderBottomColor: 'rgba(45, 62, 49, 0.1)',
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
  },
  menuItemText: {
    flex: 1,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  sidePanel: {
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    height: screenHeight,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    top: 0,
    width: PANEL_WIDTH,
  },
  title: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 18,
    textAlign: 'center',
  },
});
