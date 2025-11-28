import apiClient from './apiClient';
import { defaultNetworkCatch, Result } from './shared.types';

export interface AddPrayerAccessRequest {
  accessType: 'group' | 'user';
  accessTypeId: number;
}

export interface AddPrayerAccessResponse {
  message: string;
  prayerAccessId: number;
}

export const addPrayerAccess = async (
  token: string,
  prayerId: number,
  accessType: 'group' | 'user',
  accessTypeId: number
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
    const requestData: AddPrayerAccessRequest = {
      accessType,
      accessTypeId,
    };

    const response = await apiClient.post(`/prayers/${prayerId}/access`, requestData);

    console.log('addPrayerAccess response:', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('addPrayerAccess error:', error);
    return defaultNetworkCatch(error);
  }
};