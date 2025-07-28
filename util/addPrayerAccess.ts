import axios from 'axios';
import { BASE_API_URL, defaultNetworkCatch, Result } from './shared.types';

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
    const url = `${BASE_API_URL}/prayers/${prayerId}/access`;
    const requestData: AddPrayerAccessRequest = {
      accessType,
      accessTypeId,
    };

    const response = await axios.post(url, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('addPrayerAccess response:', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('addPrayerAccess error:', error);
    return defaultNetworkCatch(error);
  }
};