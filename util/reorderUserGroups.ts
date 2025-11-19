import axios from 'axios';

import {
  BASE_API_URL,
  DefaultAPIResponse,
  defaultNetworkCatch,
  Result,
} from './shared.types';

export interface ReorderGroupsRequest {
  groups: Array<{
    groupId: number;
    displaySequence: number;
  }>;
}

export const reorderUserGroups = async (
  token: string,
  userProfileId: number,
  reorderData: ReorderGroupsRequest
): Promise<Result<DefaultAPIResponse>> => {
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
    const url = `${BASE_API_URL}/users/${userProfileId}/groups/reorder`;
    const response = await axios.patch(url, reorderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('reorderUserGroups response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
