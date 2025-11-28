import apiClient from './apiClient';
import { defaultNetworkCatch, Result } from './shared.types';

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
    const response = await apiClient.delete(`/users/${userProfileId}/account`);

    const deleteResponse: DeleteAccountResponse = {
      message: response.data.message,
    };
    console.log('deleteUserAccount response: ', deleteResponse);

    return { success: true, data: deleteResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
