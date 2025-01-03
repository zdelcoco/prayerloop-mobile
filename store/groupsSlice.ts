import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { getUserGroups } from '@/util/getUserGroups';

import { Group } from '@/util/getUserGroups.types';

interface UserGroupsState {
  groups: Group[] | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
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
    clearUserGroups: (state) => {
      state.status = 'idle';
      state.groups = null;
      state.error = null;
    },
  },
});

export const {
  getUserGroupsStart,
  getUserGroupsSuccess,
  getUserGroupsFailure,
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

export const clearUserGroups = (): AppThunk => async (dispatch) => {
  dispatch(userGroupsSlice.actions.clearUserGroups());
};

export default userGroupsSlice.reducer;
