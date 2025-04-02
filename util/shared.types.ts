import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

export interface ResponseError {
  type: string;
  message: string;
}

export interface Result {
  data?: any;
  error?: ResponseError;
  success: boolean;
}

export interface DefaultAPIResponse {
  message?: string;
  error?: string;
};

export interface Prayer {
  createdBy: number;
  datetimeAnswered: string | null;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  isAnswered: boolean;
  isPrivate: boolean;
  prayerDescription: string;
  prayerAccessId: number;
  prayerId: number;
  prayerPriority: number;
  prayerType: string;
  title: string;
  updatedBy: number;
  userProfileId: number;
}

export const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const defaultNetworkCatch = (error: unknown): Result => {
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
      message: 'An unknown error occurred.\n' + error,
    },
  };
};
