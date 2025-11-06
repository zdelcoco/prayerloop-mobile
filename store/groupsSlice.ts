import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { getUserGroups } from '@/util/getUserGroups';
import { createGroup } from '@/util/createGroup';
import { CreateGroupRequest } from '@/util/createGroup.types';
import { leaveGroup } from '@/util/leaveGroup';
import { deleteGroup } from '@/util/deleteGroup';

import { Group } from '@/util/shared.types';
import { clearGroupPrayers } from './groupPrayersSlice';

interface UserGroupsState {
  groups: Group[] | null;
  status: 'idle' | 'creating' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserGroupsState = {
  groups: null,
  status: 'idle',
  error: null,
};

const userGroupsSlice = createSlice({
  name: 'userGroups',
  initialState,
  reducers: {
    getUserGroupsStart: (state) => {
      state.status = 'loading';
    },
    getUserGroupsSuccess: (state, action: PayloadAction<Group[]>) => {
      state.status = 'succeeded';
      state.groups = action.payload;
    },
    getUserGroupsFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    createGroupStart: (state) => {
      state.status = 'creating';
    },
    createGroupSuccess: (state) => {
      state.status = 'succeeded';
    },
    createGroupFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearUserGroups: (state) => {
      state.status = 'idle';
      state.groups = null;
      state.error = null;
    },
    leaveGroupStart: (state) => {
      state.status = 'loading';
    },
    leaveGroupSuccess: (state, action: PayloadAction<number>) => {
      state.status = 'succeeded';
      // Remove the group from the local state
      if (state.groups) {
        state.groups = state.groups.filter(
          (group) => group.groupId !== action.payload
        );
      }
    },
    leaveGroupFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    deleteGroupStart: (state) => {
      state.status = 'loading';
    },
    deleteGroupSuccess: (state, action: PayloadAction<number>) => {
      state.status = 'succeeded';
      // Remove the group from the local state
      if (state.groups) {
        state.groups = state.groups.filter(
          (group) => group.groupId !== action.payload
        );
      }
    },
    deleteGroupFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
  },
});

export const {
  getUserGroupsStart,
  getUserGroupsSuccess,
  getUserGroupsFailure,
  createGroupStart,
  createGroupSuccess,
  createGroupFailure,
  leaveGroupStart,
  leaveGroupSuccess,
  leaveGroupFailure,
  deleteGroupStart,
  deleteGroupSuccess,
  deleteGroupFailure,
} = userGroupsSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const selectUserGroups = (state: RootState) => state.userGroups.groups;

export const selectUserGroupsStatus = (state: RootState) =>
  state.userGroups.status;

export const selectUserGroupsError = (state: RootState) =>
  state.userGroups.error;

export const fetchUserGroups = (): AppThunk => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    dispatch(getUserGroupsFailure('Unauthorized access. Please log in.'));
    return;
  }

  dispatch(clearGroupPrayers());
  dispatch(getUserGroupsStart());

  try {
    const result = await getUserGroups(auth.token, auth.user.userProfileId);
    if (result.success) {
      dispatch(getUserGroupsSuccess(result.data));
    } else {
      dispatch(
        getUserGroupsFailure(result.error?.message || 'An error occurred.')
      );
    }
  } catch (error) {
    dispatch(getUserGroupsFailure('An error occurred.'));
  }
};

export const addGroup =
  (groupRequest: CreateGroupRequest): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(createGroupFailure('User not authenticated'));
      return;
    }

    dispatch(createGroupStart());

    try {
      const result = await createGroup(
        auth.token,
        groupRequest
      );
      if (result.success) {
        dispatch(createGroupSuccess());
        dispatch(fetchUserGroups());
      } else {
        dispatch(
          createGroupFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      dispatch(createGroupFailure('An error occurred.'));
    }
  };

export const clearUserGroups = (): AppThunk => async (dispatch) => {
  dispatch(userGroupsSlice.actions.clearUserGroups());
};

export const removeUserFromGroup =
  (groupId: number, userId?: number): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(leaveGroupFailure('User not authenticated'));
      return { success: false, error: 'User not authenticated' };
    }

    // If no userId provided, use current user (leave group)
    const targetUserId = userId || auth.user.userProfileId;

    dispatch(leaveGroupStart());

    try {
      const result = await leaveGroup(
        auth.token,
        groupId,
        targetUserId
      );
      if (result.success) {
        // Only remove from local state if current user left
        if (targetUserId === auth.user.userProfileId) {
          dispatch(leaveGroupSuccess(groupId));
        }
        return { success: true };
      } else {
        dispatch(
          leaveGroupFailure(result.error?.message || 'An error occurred.')
        );
        return { success: false, error: result.error?.message };
      }
    } catch (error) {
      dispatch(leaveGroupFailure('An error occurred.'));
      return { success: false, error: 'An error occurred.' };
    }
  };

export const deleteGroupById =
  (groupId: number): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(deleteGroupFailure('User not authenticated'));
      return { success: false, error: 'User not authenticated' };
    }

    dispatch(deleteGroupStart());

    try {
      const result = await deleteGroup(auth.token, groupId);
      if (result.success) {
        dispatch(deleteGroupSuccess(groupId));
        // Clear group prayers to prevent fetching data for deleted group
        dispatch(clearGroupPrayers());
        return { success: true };
      } else {
        dispatch(
          deleteGroupFailure(result.error?.message || 'An error occurred.')
        );
        return { success: false, error: result.error?.message };
      }
    } catch (error) {
      dispatch(deleteGroupFailure('An error occurred.'));
      return { success: false, error: 'An error occurred.' };
    }
  };

export default userGroupsSlice.reducer;
