/*
  
  DEPRECATE THIS

  HANDLE ON BACKEND -- IF LAST OF PRAYER_ACCESS, THEN DELETE THE PRAYER ENTIRELY

*/
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import { DefaultAPIResponse } from './shared.types';
import { Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const deletePrayer = async (
  token: string,
  prayerId: number
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
    console.log('deletePrayer url:', url);
    console.log('deletePrayer prayerId:', prayerId);
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const deletePrayerResponse: DefaultAPIResponse = {
      message: response.data.message,
      error: response.data.error,
    };
    console.log('deletePrayer response: ', deletePrayerResponse);

    return { success: true, data: deletePrayerResponse };
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