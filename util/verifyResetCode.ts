import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  message: string;
  token: string;
  userId: number;
}

export const verifyResetCode = async (
  email: string,
  code: string
): Promise<Result<VerifyResetCodeResponse>> => {
  try {
    const url = `${BASE_API_URL}/auth/verify-reset-code`;
    const requestData: VerifyResetCodeRequest = {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    };

    const response = await axios.post<VerifyResetCodeResponse>(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('verifyResetCode response:', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('verifyResetCode error:', error);

    // Handle specific errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return {
        success: false,
        error: {
          type: 'InvalidCode',
          message: error.response.data?.error || 'Invalid or expired verification code',
        },
      };
    }

    return defaultNetworkCatch(error);
  }
};
