/*

  TODO -- BACKEND ADJUSTMENT TO HANDLE DELETE PRAYER IF LAST OF PRAYER_ACCESS

  FOR NOW THIS WILL RESULT IN ORPHANED PRAYER RECORDS

*/
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import { DefaultAPIResponse } from './shared.types';
import { Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const removePrayerAccess = async (
  token: string,
  prayerId: number,
  prayerAccessId: number
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
    const url = `${BASE_API_URL}/prayers/${prayerId}/access/${prayerAccessId}`;
    console.log('removePrayerAccess url:', url);
    console.log('removePrayerAccess prayerId:', prayerId);
    console.log('removePrayerAccess prayerAccessId:', prayerAccessId);
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const removePrayerResponse: DefaultAPIResponse = {
      message: response.data.message,
    };
    console.log('removePrayerAccess response: ', removePrayerResponse);

    return { success: true, data: removePrayerResponse };
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
            message: 'Request timed out. Please try again later.',
          },
        };
      }
    }

    return {
      success: false,
      error: {
        type: 'Unknown',
        message: 'An unknown error occurred.\n' + error,
      },
    };
  }
};
