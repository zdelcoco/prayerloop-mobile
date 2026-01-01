import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserGroups } from '@/store/groupsSlice';
import { router, useLocalSearchParams } from 'expo-router';
import { joinGroup } from '@/util/joinGroup';

// Color constants matching the app theme
const ACTIVE_GREEN = '#2E7D32';
const MUTED_GREEN = '#ccf0ccff';
const DARK_TEXT = '#2d3e31';
const SUBTLE_TEXT = '#5a6b5e';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ICON_SIZE = 100;
const HEADER_HEIGHT = 56;

export default function JoinGroupModal() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { token } = useAppSelector((state) => state.auth);
  const params = useLocalSearchParams<{ code?: string }>();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const headerGradientEnd = totalHeaderHeight / SCREEN_HEIGHT;

  const canJoin = inviteCode.trim().length > 0;

  // Handle invite code from deep link
  useEffect(() => {
    if (params.code) {
      const code = Array.isArray(params.code) ? params.code[0] : params.code;
      setInviteCode(code);

      Alert.alert(
        'Invite Code Loaded',
        'The invite code has been automatically filled from your link. Tap the checkmark to join.',
        [{ text: 'OK' }]
      );
    }
  }, [params.code]);

  const handleClose = useCallback(() => {
    if (inviteCode.trim()) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to cancel joining this prayer circle?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [inviteCode, navigation]);

  const handleJoin = useCallback(async () => {
    if (!inviteCode.trim() || !token) return;

    // Validate invite code format
    const parts = inviteCode.trim().split('-');
    if (parts.length !== 2) {
      Alert.alert(
        'Invalid Code',
        'Please enter a valid invite code (format: XXXX-XXXX)'
      );
      return;
    }

    const groupId = parseInt(parts[0], 10);
    if (isNaN(groupId)) {
      Alert.alert(
        'Invalid Code',
        'Please enter a valid invite code (format: XXXX-XXXX)'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await joinGroup(token, groupId, inviteCode);

      if (result.success) {
        await dispatch(fetchUserGroups());

        Alert.alert('Success!', 'You have successfully joined the prayer circle!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              router.replace('/(tabs)/groups');
            },
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          result.error?.message ||
            'Failed to join prayer circle. Please check the invite code and try again.'
        );
      }
    } catch (error) {
      console.error('Error joining prayer circle:', error);
      Alert.alert('Error', 'Failed to join prayer circle. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [inviteCode, token, dispatch, navigation]);

  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: headerGradientEnd }}
      end={{ x: 0, y: 1 }}
    >
      {/* Custom Header */}
      <View style={[styles.header, { height: HEADER_HEIGHT, marginTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={DARK_TEXT} />
        </Pressable>

        <Text style={styles.headerTitle}>Join Prayer Circle</Text>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
            !canJoin && styles.headerButtonDisabled,
          ]}
          onPress={handleJoin}
          disabled={!canJoin || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={ACTIVE_GREEN} />
          ) : (
            <Ionicons
              name="checkmark"
              size={24}
              color={canJoin ? ACTIVE_GREEN : SUBTLE_TEXT}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="enter-outline" size={50} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.subtitle}>
            Enter the invite code you received to join a prayer circle
          </Text>
        </View>

        {/* Invite Code Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>Invite Code</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="XXXX-XXXX"
                  placeholderTextColor={SUBTLE_TEXT}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  textAlign="center"
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <BlurView intensity={8} tint="regular" style={styles.sectionBlur}>
            <View style={styles.helpContent}>
              <Ionicons name="information-circle-outline" size={20} color={SUBTLE_TEXT} style={styles.helpIcon} />
              <Text style={styles.helpText}>
                Ask the prayer circle creator or a member to share an invite code with you. The code looks like "1234-ABCD".
              </Text>
            </View>
          </BlurView>
        </View>

        {/* Bottom padding for scroll */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.extraLargeSpinner}>
              <ActivityIndicator size="large" color="#b2d8b2" />
            </View>
            <Text style={styles.loadingText}>Joining...</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  extraLargeSpinner: {
    transform: [{ scale: 2 }],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 36,
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  headerTitle: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 18,
  },
  helpContent: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helpIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpText: {
    color: SUBTLE_TEXT,
    flex: 1,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: ACTIVE_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: ICON_SIZE / 2,
    borderWidth: 4,
    elevation: 4,
    height: ICON_SIZE,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: ICON_SIZE,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  input: {
    color: DARK_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 24,
    letterSpacing: 4,
    paddingVertical: 8,
  },
  inputRow: {
    paddingVertical: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    paddingBottom: 30,
    paddingHorizontal: 60,
    paddingTop: 48,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  loadingText: {
    color: '#b2d8b2',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 24,
    marginTop: 48,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionBlur: {
    borderColor: 'rgba(252, 251, 231, 0.58)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sectionLabel: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
    marginLeft: 12,
    marginRight: 12,
    textTransform: 'uppercase',
  },
  sectionLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionLabelLine: {
    backgroundColor: 'rgba(45, 62, 49, 0.2)',
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  subtitle: {
    color: SUBTLE_TEXT,
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    marginTop: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
