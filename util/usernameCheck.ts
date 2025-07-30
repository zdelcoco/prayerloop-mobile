import axios, { AxiosError } from 'axios';
import { BASE_API_URL, Result } from './shared.types';

export interface UsernameCheckResponse {
  username: string;
  available: boolean;
}

export const checkUsernameAvailability = async (
  username: string
): Promise<Result> => {
  if (!username || username.trim() === '') {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: 'Username is required',
      },
    };
  }

  try {
    const url = `${BASE_API_URL}/check-username?username=${encodeURIComponent(username)}`;
    const response = await axios.get(url);

    const checkResponse: UsernameCheckResponse = {
      username: response.data.username,
      available: response.data.available,
    };

    return { success: true, data: checkResponse };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        if (axiosError.response.status >= 500) {
          return {
            success: false,
            error: {
              type: 'ServerError',
              message: 'Server error occurred. Please try again later.',
            },
          };
        } else {
          const errorMessage = (axiosError.response.data as any)?.error || 'Failed to check username availability';
          return {
            success: false,
            error: {
              type: 'RequestError',
              message: errorMessage,
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
  }
};