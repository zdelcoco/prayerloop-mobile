import apiClient from './apiClient';

import {
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
    const response = await apiClient.patch(`/users/${userProfileId}/groups/reorder`, reorderData);

    console.log('reorderUserGroups response: ', response.data);

    return { success: true, data: response.data };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
