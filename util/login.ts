import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

import { LoginResponse } from './login.types';
import { Result } from './shared.types';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;
const BASE_API_PORT = Constants.expoConfig?.extra?.apiPort;

export const loginUser = async (
  username: string,
  password: string
): Promise<Result> => {
  if (username === '' || password === '') {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: 'Username and password are required',
      },
    };
  }

  try {
    const url = `${BASE_API_URL}:${BASE_API_PORT}/login`;
    const response = await axios.post(url, { username, password });

    const loginResponse: LoginResponse = {
      message: response.data.message,
      token: response.data.token,
      user: response.data.user,
    };

    return { success: true, data: loginResponse };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          return {
            success: false,
            error: {
              type: 'InvalidCredentials',
              message: 'Invalid username or password',
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
      error: { type: 'UnknownError', message: 'An unknown error occurred.' },
    };
  }
};
