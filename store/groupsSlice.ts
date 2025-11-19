import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { getUserGroups } from '@/util/getUserGroups';
import { createGroup } from '@/util/createGroup';
import { CreateGroupRequest } from '@/util/createGroup.types';
import { leaveGroup } from '@/util/leaveGroup';
import { deleteGroup } from '@/util/deleteGroup';
import { reorderUserGroups, ReorderGroupsRequest } from '@/util/reorderUserGroups';

import { Group } from '@/util/shared.types';
import { clearGroupPrayers } from './groupPrayersSlice';

export interface GroupFilterOptions {
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
}

interface UserGroupsState {
  groups: Group[] | null;
  status: 'idle' | 'creating' | 'loading' | 'reordering' | 'succeeded' | 'failed';
  error: string | null;
  searchQuery: string;
  filters: GroupFilterOptions;
}

const initialState: UserGroupsState = {
  groups: null,
  status: 'idle',
  error: null,
  searchQuery: '',
  filters: {
    dateRange: 'all',
  },
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
    reorderUserGroupsStart: (state) => {
      state.status = 'reordering';
    },
    reorderUserGroupsSuccess: (state, action: PayloadAction<Group[]>) => {
      state.status = 'succeeded';
      state.groups = action.payload;
    },
    reorderUserGroupsFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    setGroupSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setGroupFilters: (state, action: PayloadAction<GroupFilterOptions>) => {
      state.filters = action.payload;
    },
    clearGroupSearchAndFilters: (state) => {
      state.searchQuery = '';
      state.filters = {
        dateRange: 'all',
      };
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
  reorderUserGroupsStart,
  reorderUserGroupsSuccess,
  reorderUserGroupsFailure,
  setGroupSearchQuery,
  setGroupFilters,
  clearGroupSearchAndFilters,
} = userGroupsSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

// Direct selectors
export const selectUserGroups = (state: RootState) => state.userGroups.groups;

export const selectUserGroupsStatus = (state: RootState) =>
  state.userGroups.status;

export const selectUserGroupsError = (state: RootState) =>
  state.userGroups.error;

export const selectGroupSearchQuery = (state: RootState) => state.userGroups.searchQuery;

export const selectGroupFilters = (state: RootState) => state.userGroups.filters;

// Memoized selector for filtered groups
export const selectFilteredGroups = createSelector(
  [
    (state: RootState) => state.userGroups.groups,
    (state: RootState) => state.userGroups.searchQuery,
    (state: RootState) => state.userGroups.filters,
  ],
  (groups, searchQuery, filters) => {
    if (!groups) return null;

    let filtered = [...groups];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.groupName.toLowerCase().includes(query) ||
          group.groupDescription.toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let cutoffDate: Date;

      switch (filters.dateRange) {
        case 'today':
          cutoffDate = startOfDay;
          break;
        case 'week':
          cutoffDate = new Date(startOfDay);
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case 'month':
          cutoffDate = new Date(startOfDay);
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
        case 'year':
          cutoffDate = new Date(startOfDay);
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter((group) => {
        const createdDate = new Date(group.datetimeCreate);
        return createdDate >= cutoffDate;
      });
    }

    return filtered;
  }
);

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

export const reorderGroups =
  (reorderedGroups: Group[]): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(reorderUserGroupsFailure('User not authenticated'));
      return;
    }

    dispatch(reorderUserGroupsStart());

    // Optimistically update the local state
    dispatch(reorderUserGroupsSuccess(reorderedGroups));

    try {
      const reorderData: ReorderGroupsRequest = {
        groups: reorderedGroups.map((group, index) => ({
          groupId: group.groupId,
          displaySequence: index,
        })),
      };

      const result = await reorderUserGroups(
        auth.token,
        auth.user.userProfileId,
        reorderData
      );

      if (!result.success) {
        // Revert on failure by refetching
        dispatch(fetchUserGroups());
        dispatch(
          reorderUserGroupsFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      // Revert on failure by refetching
      dispatch(fetchUserGroups());
      dispatch(reorderUserGroupsFailure('An error occurred.'));
    }
  };

export default userGroupsSlice.reducer;
