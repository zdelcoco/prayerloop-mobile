import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export const forgotPassword = async (
  email: string
): Promise<Result<ForgotPasswordResponse>> => {
  try {
    const url = `${BASE_API_URL}/auth/forgot-password`;
    const requestData: ForgotPasswordRequest = {
      email: email.trim().toLowerCase(),
    };

    const response = await axios.post<ForgotPasswordResponse>(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('forgotPassword response:', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('forgotPassword error:', error);
    return defaultNetworkCatch(error);
  }
};
