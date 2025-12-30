import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

export interface ResponseError {
  type: string;
  message: string;
}

export interface Result<T = any> {
  data?: T;
  error?: ResponseError;
  success: boolean;
}

export interface DefaultAPIResponse {
  message?: string;
  error?: string;
}

export interface User {
  createdBy: number;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  admin: boolean;
  updatedBy: number;
  userProfileId: number;
  username: string;
}

export interface Prayer {
  createdBy: number;
  datetimeAnswered: string | null;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  isAnswered: boolean;
  isPrivate: boolean;
  prayerDescription: string;
  prayerAccessId: number;
  prayerId: number;
  prayerPriority: number;
  prayerType: string;
  title: string;
  updatedBy: number;
  userProfileId: number;
}

export interface Group {
  createdBy: number;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  groupDescription: string;
  groupId: number;
  groupName: string;
  isActive: boolean;
  updatedBy: number;
}

export interface CreatePrayerRequest {
  title: string;
  prayerDescription: string;
  isPrivate: boolean;
  prayerType: string;
  prayerSubjectId?: number;
}

export interface PrayerSubject {
  prayerSubjectId: number;
  prayerSubjectType: 'individual' | 'family' | 'group';
  prayerSubjectDisplayName: string;
  notes: string | null;
  displaySequence: number;
  photoS3Key: string | null;
  userProfileId: number | null;
  useLinkedUserPhoto: boolean;
  linkStatus: 'unlinked' | 'pending' | 'linked' | 'declined';
  datetimeCreate: string;
  datetimeUpdate: string;
  createdBy: number;
  updatedBy: number;
  prayers: Prayer[];
}

export interface CreatePrayerSubjectRequest {
  prayerSubjectType: 'individual' | 'family' | 'group';
  prayerSubjectDisplayName: string;
  notes?: string;
  photoS3Key?: string;
  userProfileId?: number;
  useLinkedUserPhoto?: boolean;
}

export interface UpdatePrayerSubjectRequest {
  prayerSubjectDisplayName?: string;
  notes?: string;
  photoS3Key?: string;
  useLinkedUserPhoto?: boolean;
}

export interface CreatePrayerResponse {
  message: string;
  prayerId: number;
  prayerAccessId: number;
}

export const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const defaultNetworkCatch = (error: unknown): Result => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      if (axiosError.response.status === 401) {
        return {
          success: false,
          error: {
            type: 'Unauthorized',
            message: 'Unauthorized access. Please log in.',
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
};
