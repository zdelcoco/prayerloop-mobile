import axios from 'axios';
//import { BASE_API_URL, BASE_API_PORT } from '@env';

const BASE_API_URL = 'http://localhost';
const BASE_API_PORT = 3000;

export const loginUser = async (username, password) => {
  try {
    const url = `${BASE_API_URL}:${BASE_API_PORT}/login`;
    const response = await axios.post(url, { username, password });

    return { success: true, data: response.data };
    
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        return {
          success: false,
          error: {
            type: 'InvalidCredentials',
            message: 'Invalid username or password',
          },
        };
      } else if (error.response.status >= 500) {
        return {
          success: false,
          error: {
            type: 'ServerError',
            message: 'Server error occurred. Please try again later.',
          },
        };
      }
    } else if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          type: 'TimeoutError',
          message: 'Request timed out. Please try again.',
        },
      };
    }
    return {
      success: false,
      error: { type: 'UnknownError', message: 'An unknown error occurred.' },
    };
  }
};
