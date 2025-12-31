import axios, { AxiosError } from 'axios';
import apiClient from './apiClient';

import {
  Group,
  Result,
} from './shared.types';

export interface UpdateGroupRequest {
  groupName?: string;
  groupDescription?: string;
}

export const updateGroup = async (
  token: string,
  groupId: number,
  updateGroupRequest: UpdateGroupRequest
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
    const response = await apiClient.put(`/groups/${groupId}`, updateGroupRequest);

    const groupResponse: Group = {
      groupId: response.data.groupId,
      groupName: response.data.groupName,
      groupDescription: response.data.groupDescription,
      isActive: response.data.isActive,
      datetimeCreate: response.data.datetimeCreate,
      datetimeUpdate: response.data.datetimeUpdate,
      createdBy: response.data.createdBy,
      updatedBy: response.data.updatedBy,
      deleted: response.data.deleted
    };

    return { success: true, data: groupResponse };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          return {
            success: false,
            error: {
              type: 'InvalidPermissions',
              message: 'You do not have permission to update this prayer circle.',
            },
          };
        } else if (axiosError.response.status === 403) {
          return {
            success: false,
            error: {
              type: 'Forbidden',
              message: 'Only the creator can update this prayer circle.',
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
