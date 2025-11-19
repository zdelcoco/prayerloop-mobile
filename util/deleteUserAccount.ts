import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

export interface DeleteAccountResponse {
  message: string;
}

export const deleteUserAccount = async (
  token: string,
  userProfileId: number,
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
    const url = `${BASE_API_URL}/users/${userProfileId}/account`;
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const deleteResponse: DeleteAccountResponse = {
      message: response.data.message,
    };
    console.log('deleteUserAccount response: ', deleteResponse);

    return { success: true, data: deleteResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
