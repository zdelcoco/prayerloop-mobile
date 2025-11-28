import axios, { AxiosError } from 'axios';
import apiClient from './apiClient';

import {
  Group,
  Result,
} from './shared.types';

import { CreateGroupRequest } from './createGroup.types';

export const createGroup = async (
  token: string,
  createGroupRequest: CreateGroupRequest
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
    console.log('createGroup request: ', createGroupRequest);
    const response = await apiClient.post('/groups', createGroupRequest);

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
    console.log('createGroup response: ', groupResponse);

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
              message: 'You do not have permission to create a group.',
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
