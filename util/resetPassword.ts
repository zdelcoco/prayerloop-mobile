import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<Result<ResetPasswordResponse>> => {
  try {
    const url = `${BASE_API_URL}/auth/reset-password`;
    const requestData: ResetPasswordRequest = {
      token: token.trim(),
      newPassword,
    };

    const response = await axios.post<ResetPasswordResponse>(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('resetPassword response:', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('resetPassword error:', error);

    // Handle specific errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return {
          success: false,
          error: {
            type: 'InvalidToken',
            message: 'Invalid or expired token. Please start over.',
          },
        };
      }
      if (error.response?.status === 400) {
        return {
          success: false,
          error: {
            type: 'ValidationError',
            message: error.response.data?.error || 'Password must be at least 6 characters',
          },
        };
      }
    }

    return defaultNetworkCatch(error);
  }
};
