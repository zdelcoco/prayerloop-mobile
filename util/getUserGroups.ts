import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import { Group } from './getUserGroups.types';
import { Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const getUserGroups = async (
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
    const url = `${BASE_API_URL}/users/${userProfileId}/groups`;
    console.log('getUserGroups url: ', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const groupsResponse: Group[] = response.data;
    console.log('getUserGroups response: ', groupsResponse);

    return { success: true, data: groupsResponse };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          return {
            success: false,
            error: {
              type: 'Unauthorized',
              message: 'Unauthorized access. Please log in.',
            },
          };
        } else if (axiosError.response.status >= 500) {
          return {
            success: false,
            error: {
              type: 'ServerError',
              message: 'Server error occurred. Please try again later.',
            },
          };
        }
      } else if (axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          error: {
            type: 'Timeout',
            message: 'Request timed out. Please try again.',
          },
        };
      }
    }

    return {
      success: false,
      error: {
        type: 'Unknown',
        message: 'An unknown error occurred. Please try again.',
      },
    };
  }
};
