import apiClient from './apiClient';
import {
  defaultNetworkCatch,
  Result,
  PrayerSubject,
  PrayerSubjectMember,
  CreatePrayerSubjectRequest,
  UpdatePrayerSubjectRequest,
} from './shared.types';

export interface GetPrayerSubjectsResponse {
  message: string;
  prayerSubjects: PrayerSubject[];
}

export interface CreatePrayerSubjectResponse {
  message: string;
  prayerSubjectId: number;
}

export interface ReorderPrayerSubjectsRequest {
  prayerSubjects: {
    prayerSubjectId: number;
    displaySequence: number;
  }[];
}

export interface GetPrayerSubjectMembersResponse {
  message: string;
  members: PrayerSubjectMember[];
}

export const getPrayerSubjects = async (
  token: string,
  userProfileId: number
): Promise<Result<GetPrayerSubjectsResponse>> => {
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
    const response = await apiClient.get(
      `/users/${userProfileId}/prayer-subjects`
    );

    const prayerSubjectsResponse: GetPrayerSubjectsResponse = {
      message: response.data.message,
      prayerSubjects: response.data.prayerSubjects,
    };

    return { success: true, data: prayerSubjectsResponse };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const createPrayerSubject = async (
  token: string,
  userProfileId: number,
  prayerSubject: CreatePrayerSubjectRequest
): Promise<Result<CreatePrayerSubjectResponse>> => {
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
    const response = await apiClient.post(
      `/users/${userProfileId}/prayer-subjects`,
      prayerSubject
    );

    // Handle both response formats from backend:
    // 1. { prayerSubjectId: N } - partial success (couldn't fetch created subject)
    // 2. { prayerSubject: {...} } - full success (includes full object with prayerSubjectId)
    const prayerSubjectId = response.data.prayerSubjectId
      ?? response.data.prayerSubject?.prayerSubjectId;

    return {
      success: true,
      data: {
        message: response.data.message,
        prayerSubjectId,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const updatePrayerSubject = async (
  token: string,
  prayerSubjectId: number,
  prayerSubject: UpdatePrayerSubjectRequest
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
    const response = await apiClient.patch(
      `/prayer-subjects/${prayerSubjectId}`,
      prayerSubject
    );

    return {
      success: true,
      data: {
        message: response.data.message,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const deletePrayerSubject = async (
  token: string,
  prayerSubjectId: number,
  reassignToSelf: boolean = true
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
    const response = await apiClient.delete(
      `/prayer-subjects/${prayerSubjectId}`,
      {
        params: { reassignToSelf },
      }
    );

    return {
      success: true,
      data: {
        message: response.data.message,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const reorderPrayerSubjects = async (
  token: string,
  userProfileId: number,
  reorderData: ReorderPrayerSubjectsRequest
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
    const response = await apiClient.patch(
      `/users/${userProfileId}/prayer-subjects/reorder`,
      reorderData
    );

    return {
      success: true,
      data: {
        message: response.data.message,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const getPrayerSubjectMembers = async (
  token: string,
  prayerSubjectId: number
): Promise<Result<GetPrayerSubjectMembersResponse>> => {
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
    const response = await apiClient.get(
      `/prayer-subjects/${prayerSubjectId}/members`
    );

    return {
      success: true,
      data: {
        message: response.data.message,
        members: response.data.members,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export interface ParentGroup {
  prayerSubjectMembershipId: number;
  groupPrayerSubjectId: number;
  membershipRole: string | null;
  datetimeCreate: string;
  createdBy: number;
  groupDisplayName: string;
  groupType: 'family' | 'group';
  groupPhotoS3Key: string | null;
}

export interface GetSubjectParentGroupsResponse {
  message: string;
  parents: ParentGroup[];
}

export const getPrayerSubjectParentGroups = async (
  token: string,
  prayerSubjectId: number
): Promise<Result<GetSubjectParentGroupsResponse>> => {
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
    const response = await apiClient.get(
      `/prayer-subjects/${prayerSubjectId}/parents`
    );

    return {
      success: true,
      data: {
        message: response.data.message,
        parents: response.data.parents,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export interface AddMemberToSubjectRequest {
  memberPrayerSubjectId: number;
}

export interface AddMemberToSubjectResponse {
  message: string;
  membershipId: number;
}

export const addMemberToSubject = async (
  token: string,
  prayerSubjectId: number,
  memberPrayerSubjectId: number
): Promise<Result<AddMemberToSubjectResponse>> => {
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
    const response = await apiClient.post(
      `/prayer-subjects/${prayerSubjectId}/members`,
      { memberPrayerSubjectId }
    );

    return {
      success: true,
      data: {
        message: response.data.message,
        membershipId: response.data.membershipId,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};

export const removeMemberFromSubject = async (
  token: string,
  prayerSubjectId: number,
  memberPrayerSubjectId: number
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
    const response = await apiClient.delete(
      `/prayer-subjects/${prayerSubjectId}/members/${memberPrayerSubjectId}`
    );

    return {
      success: true,
      data: {
        message: response.data.message,
      },
    };
  } catch (error: unknown) {
    return defaultNetworkCatch(error);
  }
};
