import axios, { AxiosError } from 'axios';
import { SignupResponse, SignupRequest } from './signup.types';
import { BASE_API_URL, Result } from './shared.types';

export const signupUser = async (
  signupData: SignupRequest
): Promise<Result> => {
  // Basic validation - required fields: email, password, firstName
  if (!signupData.email || !signupData.password || !signupData.firstName) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: 'Email, password, and first name are required',
      },
    };
  }

  // Password strength validation
  if (signupData.password.length < 6) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: 'Password must be at least 6 characters long',
      },
    };
  }

  // Email validation (if provided)
  if (signupData.email && !validateEmail(signupData.email)) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: 'Please enter a valid email address',
      },
    };
  }

  // Phone validation (if provided)
  if (signupData.phoneNumber && !validatePhone(signupData.phoneNumber)) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: 'Please enter a valid phone number',
      },
    };
  }

  try {
    console.log('signing up user:', signupData.email);
    const url = `${BASE_API_URL}/signup`;
    console.log('signup url:', url);
    const response = await axios.post(url, signupData);

    const signupResponse: SignupResponse = {
      message: response.data.message,
      user: response.data.user,
    };
    console.log('signup response:', signupResponse);
    return { success: true, data: signupResponse };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        if (axiosError.response.status === 400) {
          const errorMessage = (axiosError.response.data as any)?.error || 'Invalid input';
          return {
            success: false,
            error: {
              type: 'InvalidInput',
              message: errorMessage,
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
  }
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Remove all non-numeric characters for validation
  const cleaned = phone.replace(/\D/g, '');
  // US phone numbers should be exactly 10 digits
  return cleaned.length === 10;
};