import apiClient from './apiClient';
import { defaultNetworkCatch, Result } from './shared.types';
import { UserPreference, UserPreferenceUpdate, UserPreferencesWithDefaultsResponse } from './userPreferences.types';

export const getUserPreferences = async (
  token: string,
  userProfileId: number
): Promise<Result> => {
  if (!token) {
    return {
      success: false,
      error: {
        type: 'Unauthorized',
        message: 'Unauthorized access. Please log in.',
      },
    };
  }

  try {
    const response = await apiClient.get(`/users/${userProfileId}/preferences`);

    const preferencesResponse: UserPreference[] = response.data;
    console.log('getUserPreferences response: ', preferencesResponse);

    return { success: true, data: preferencesResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const getUserPreferencesWithDefaults = async (
  token: string,
  userProfileId: number
): Promise<Result> => {
  if (!token) {
    return {
      success: false,
      error: {
        type: 'Unauthorized',
        message: 'Unauthorized access. Please log in.',
      },
    };
  }

  try {
    const response = await apiClient.get(`/users/${userProfileId}/preferences`);

    // The backend GetUserPreferencesWithDefaults returns preferences with defaults merged
    const preferencesResponse: UserPreferencesWithDefaultsResponse = response.data;
    console.log('getUserPreferencesWithDefaults response: ', preferencesResponse);

    return { success: true, data: preferencesResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const updateUserPreference = async (
  token: string,
  userProfileId: number,
  preferenceId: number,
  preferenceUpdate: UserPreferenceUpdate
): Promise<Result> => {
  if (!token) {
    return {
      success: false,
      error: {
        type: 'Unauthorized',
        message: 'Unauthorized access. Please log in.',
      },
    };
  }

  try {
    const response = await apiClient.patch(
      `/users/${userProfileId}/preferences/${preferenceId}`,
      preferenceUpdate
    );

    // The new backend returns the preference with preferenceId structure
    const updatedPreference = response.data;
    console.log('updateUserPreference response: ', updatedPreference);

    return { success: true, data: updatedPreference };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};