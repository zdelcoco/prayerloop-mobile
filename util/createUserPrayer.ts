import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import {
  CreateUserPrayerRequest,
  CreateUserPrayerResponse,
} from './createUserPrayer.types';
import { Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;
const BASE_API_PORT = Constants.expoConfig?.extra?.apiPort;

export const createUserPrayer = async (
  token: string,
  userProfileId: number,
  prayerData: CreateUserPrayerRequest
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
    const url = `${BASE_API_URL}:${BASE_API_PORT}/users/${userProfileId}/prayers`;
    const response = await axios.post(url, prayerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const prayerResponse: CreateUserPrayerResponse = {
      message: response.data.message,
      prayerId: response.data.prayerId,
      prayerAccessId: response.data.prayerAccessId,
    };

    return { success: true, data: prayerResponse };
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
