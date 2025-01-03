import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getGroupPrayers } from '../util/getGroupPrayers';
import { GetUserPrayersResponse, Prayer } from '../util/getUserPrayers.types';

interface GroupPrayersState {
  prayers: Prayer[] | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GroupPrayersState = {
  prayers: null,
  status: 'idle',
  error: null,
};

const groupPrayersSlice = createSlice({
  name: 'groupPrayers',
  initialState,
  reducers: {
    getGroupPrayersStart: (state) => {
      state.status = 'loading';
    },
    getGroupPrayersSuccess: (state, action: PayloadAction<GetUserPrayersResponse>) => {
      state.status = 'succeeded';
      state.prayers = action.payload.prayers;
    },
    getGroupPrayersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearGroupPrayers: (state) => {
      state.status = 'idle';
      state.prayers = null;
      state.error = null;
    },
  },
});

export const {
  getGroupPrayersStart,
  getGroupPrayersSuccess,
  getGroupPrayersFailure,
} = groupPrayersSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const fetchGroupPrayers =
  (
    groupId: number
  ): ThunkAction<void, RootState, unknown, PayloadAction<any>> =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token) {
      dispatch(getGroupPrayersFailure('Unauthorized access. Please log in.'));
      return;
    }
    dispatch(clearGroupPrayers());
    dispatch(getGroupPrayersStart());

    try {
      const result = await getGroupPrayers(auth.token, groupId);
      if (result.success) {
        dispatch(getGroupPrayersSuccess(result.data as GetUserPrayersResponse));
      } else {
        dispatch(
          getGroupPrayersFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      dispatch(getGroupPrayersFailure('An error occurred.'));
    }
  };

export const selectGroupPrayers = (state: RootState) =>
  state.groupPrayers.prayers;
export const selectGroupPrayersStatus = (state: RootState) =>
  state.groupPrayers.status;
export const selectGroupPrayersError = (state: RootState) =>
  state.groupPrayers.error;

export const clearGroupPrayers = (): AppThunk => async (dispatch) => {
  console.log('clearning group prayers');
  dispatch(groupPrayersSlice.actions.clearGroupPrayers());
};


export default groupPrayersSlice.reducer;
