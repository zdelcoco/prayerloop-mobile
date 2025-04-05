import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getGroupUsers } from '../util/getGroupUsers';
import { User } from '../util/shared.types';

interface GroupUsersResponse {
  groupProfileId: number;
  users: User[];
}

interface GroupUsersState {
  groupProfileId: number;
  users: User[] | null;
  status: 'idle' | 'loading' | 'creating' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GroupUsersState = {
  groupProfileId: 0,
  users: null,
  status: 'idle',
  error: null,
};

const groupUsersSlice = createSlice({
  name: 'groupUsers',
  initialState,
  reducers: {
    getGroupUsersStart: (state) => {
      state.status = 'loading';
    },
    getGroupUsersSuccess: (
      state,
      action: PayloadAction<GroupUsersResponse>
    ) => {
      state.status = 'succeeded';
      state.users = action.payload.users;
      state.groupProfileId = action.payload.groupProfileId;
    },
    getGroupUsersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },  
    clearGroupUsers: (state) => {
      state.status = 'idle';
      state.groupProfileId = 0;
      state.users = null;
      state.error = null;
    },
  },
});

export const {
  getGroupUsersStart,
  getGroupUsersSuccess,
  getGroupUsersFailure
} = groupUsersSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const fetchGroupUsers =
  (
    groupProfileId: number
  ): ThunkAction<void, RootState, unknown, PayloadAction<any>> =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token) {
      dispatch(getGroupUsersFailure('Unauthorized access. Please log in.'));
      return;
    }
    dispatch(clearGroupUsers());
    dispatch(getGroupUsersStart());

    try {
      console.log('Fetching group users...');
      const result = await getGroupUsers(auth.token, groupProfileId);
      console.log('Result: ', result);
      if (result.success) {
        dispatch(
          getGroupUsersSuccess({
            groupProfileId,
            users: result.data,
          })
        );
      } else {
        dispatch(
          getGroupUsersFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      dispatch(getGroupUsersFailure('An error occurred.'));
    }
  };

export const selectGroupUsers = (state: RootState) =>
  state.groupPrayers.prayers;
export const selectGroupUsersStatus = (state: RootState) =>
  state.groupPrayers.status;
export const selectGroupUsersError = (state: RootState) =>
  state.groupPrayers.error;

export const clearGroupUsers = (): AppThunk => async (dispatch) => {
  dispatch(groupUsersSlice.actions.clearGroupUsers());
};

export default groupUsersSlice.reducer;
