import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';
import { UserPreference, UserPreferenceUpdate } from './userPreferences.types';

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
    const url = `${BASE_API_URL}/users/${userProfileId}/preferences`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const preferencesResponse: UserPreference[] = response.data;
    console.log('getUserPreferences response: ', preferencesResponse);

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
    const url = `${BASE_API_URL}/users/${userProfileId}/preferences/${preferenceId}`;
    const response = await axios.patch(url, preferenceUpdate, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const updatedPreference: UserPreference = response.data;
    console.log('updateUserPreference response: ', updatedPreference);

    return { success: true, data: updatedPreference };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};