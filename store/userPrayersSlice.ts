import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { getUserPrayers } from '@/util/getUserPrayers';

import { GetUserPrayersResponse, Prayer } from '@/util/getUserPrayers.types';

interface UserPrayersState {
  prayers: Prayer[] | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserPrayersState = {
  prayers: null,
  status: 'idle',
  error: null,
};

const userPrayersSlice = createSlice({
  name: 'userPrayers',
  initialState,
  reducers: {
    getUserPrayersStart: (state) => {
      state.status = 'loading';
    },
    getUserPrayersSuccess: (state, action: PayloadAction<GetUserPrayersResponse>) => {
      state.status = 'succeeded';
      state.prayers = action.payload.prayers;
    },
    getUserPrayersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearUserPrayers: (state) => {
      state.status = 'idle';
      state.prayers = null;
      state.error = null;
    }
  },
});

export const { getUserPrayersStart, getUserPrayersSuccess, getUserPrayersFailure } = userPrayersSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const fetchUserPrayers = (): AppThunk => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    dispatch(getUserPrayersFailure('User not authenticated'));
    return;
  }

  dispatch(getUserPrayersStart());
  try {
    const result = await getUserPrayers(auth.token, auth.user.userProfileId);
    if (result.success) {
      dispatch(getUserPrayersSuccess(result.data as GetUserPrayersResponse));
    } else {
      dispatch(getUserPrayersFailure(result.error?.message || 'An error occurred.'));
    }
  } catch (error) {
    dispatch(getUserPrayersFailure('An error occurred.'));
  }
};



export const clearUserPrayers = (): AppThunk => async (dispatch) => {
  dispatch(userPrayersSlice.actions.clearUserPrayers());
}

export const selectUserPrayers = createSelector(
  (state: RootState) => state.userPrayers.prayers,
  (prayers) => prayers
);

export const selectUserPrayersState = (state: RootState) => state.userPrayers;

export default userPrayersSlice.reducer;