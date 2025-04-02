import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import { CreateUserPrayerRequest } from './createUserPrayer.types';
import { DefaultAPIResponse, Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const updateUserPrayer = async (
  token: string,
  prayerId: number,
  prayerData: CreateUserPrayerRequest,
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
    const url = `${BASE_API_URL}/prayers/${prayerId}`;
    console.log('updateUserPrayer url: ', url);
    console.log('updateUserPrayer data: ', prayerData);
    const response = await axios.put(url, prayerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const prayerResponse: DefaultAPIResponse = {
      message: response.data.message,
      error: response.data.error,
    };
    console.log('updateUserPrayer response: ', prayerResponse);

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
              message: 'Server error. Please try again later.',
            },
          };
        }
      }

      return {
        success: false,
        error: {
          type: 'RequestError',
          message: 'Request error. Please try again later.',
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'UnknownError',
        message: 'Unknown error. Please try again later.',
      },
    };
  }
};