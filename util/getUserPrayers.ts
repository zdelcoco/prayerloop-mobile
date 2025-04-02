import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import { GetUserPrayersResponse } from './getUserPrayers.types';
import { Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const getUserPrayers = async (
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
    const url = `${BASE_API_URL}/users/${userProfileId}/prayers`;
    console.log('getUserPrayers url: ', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const prayersResponse: GetUserPrayersResponse = {
      message: response.data.message,
      prayers: response.data.prayers,
    };
    console.log('getUserPrayers response: ', prayersResponse);

    return { success: true, data: prayersResponse };
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
            type: 'TimeoutError',
            message: 'Request timed out. Please try again.',
          },
        };
      }
    }

    return {
      success: false,
      error: {
        type: 'UnknownError',
        message: 'An unknown error occurred. Please try again later.',
      },
    };
  }
};
