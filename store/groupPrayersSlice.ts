import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getGroupPrayers } from '../util/getGroupPrayers';
import { createGroupPrayer } from '../util/createGroupPrayer';
import { reorderGroupPrayers, ReorderPrayersRequest } from '../util/reorderGroupPrayers';
import { Prayer, CreatePrayerRequest } from '../util/shared.types';

interface GroupPrayersResponse {
  groupProfileId: number;
  prayers: Prayer[];
}

interface GroupPrayersState {
  groupProfileId: number;
  prayers: Prayer[] | null;
  status: 'idle' | 'loading' | 'creating' | 'reordering' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GroupPrayersState = {
  groupProfileId: 0,
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
    getGroupPrayersSuccess: (
      state,
      action: PayloadAction<GroupPrayersResponse>
    ) => {
      state.status = 'succeeded';
      state.prayers = action.payload.prayers;
      state.groupProfileId = action.payload.groupProfileId;
    },
    getGroupPrayersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    createGroupPrayerStart: (state) => {
      state.status = 'creating';
    },
    createGroupPrayerSuccess: (state) => {
      state.status = 'succeeded';
    },
    createGroupPrayerFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    reorderGroupPrayersStart: (state) => {
      state.status = 'reordering';
    },
    reorderGroupPrayersSuccess: (state, action: PayloadAction<Prayer[]>) => {
      state.status = 'succeeded';
      state.prayers = action.payload;
    },
    reorderGroupPrayersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearGroupPrayers: (state) => {
      state.status = 'idle';
      state.groupProfileId = 0;
      state.prayers = null;
      state.error = null;
    },
  },
});

export const {
  getGroupPrayersStart,
  getGroupPrayersSuccess,
  getGroupPrayersFailure,
  createGroupPrayerStart,
  createGroupPrayerSuccess,
  createGroupPrayerFailure,
  reorderGroupPrayersStart,
  reorderGroupPrayersSuccess,
  reorderGroupPrayersFailure,
} = groupPrayersSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const fetchGroupPrayers =
  (
    groupProfileId: number
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
      const result = await getGroupPrayers(auth.token, groupProfileId);
      if (result.success) {
        dispatch(
          getGroupPrayersSuccess({
            groupProfileId,
            prayers: result.data.prayers,
          })
        );
      } else {
        dispatch(
          getGroupPrayersFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      dispatch(getGroupPrayersFailure('An error occurred.'));
    }
  };

export const addGroupPrayer =
  (groupProfileId: number, prayerRequest: CreatePrayerRequest): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(createGroupPrayerFailure('User not authenticated'));
      return;
    }

    dispatch(createGroupPrayerStart());

    try {
      const result = await createGroupPrayer(
        auth.token,
        groupProfileId,
        prayerRequest
      );
      if (result.success) {
        dispatch(createGroupPrayerSuccess());
        dispatch(fetchGroupPrayers(groupProfileId));
      } else {
        dispatch(
          createGroupPrayerFailure(
            result.error?.message || 'An error occurred.'
          )
        );
      }
    } catch (error) {
      dispatch(createGroupPrayerFailure('An error occurred.'));
    }
  };

export const reorderPrayersInGroup =
  (groupProfileId: number, reorderedPrayers: Prayer[]): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token) {
      dispatch(reorderGroupPrayersFailure('User not authenticated'));
      return;
    }

    dispatch(reorderGroupPrayersStart());

    // Optimistically update the local state
    dispatch(reorderGroupPrayersSuccess(reorderedPrayers));

    try {
      const reorderData: ReorderPrayersRequest = {
        prayers: reorderedPrayers.map((prayer, index) => ({
          prayerId: prayer.prayerId,
          displaySequence: index,
        })),
      };

      const result = await reorderGroupPrayers(
        auth.token,
        groupProfileId,
        reorderData
      );

      if (!result.success) {
        // Revert on failure by refetching
        dispatch(fetchGroupPrayers(groupProfileId));
        dispatch(
          reorderGroupPrayersFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      // Revert on failure by refetching
      dispatch(fetchGroupPrayers(groupProfileId));
      dispatch(reorderGroupPrayersFailure('An error occurred.'));
    }
  };

export const selectGroupPrayers = (state: RootState) =>
  state.groupPrayers.prayers;
export const selectGroupPrayersStatus = (state: RootState) =>
  state.groupPrayers.status;
export const selectGroupPrayersError = (state: RootState) =>
  state.groupPrayers.error;

export const clearGroupPrayers = (): AppThunk => async (dispatch) => {
  dispatch(groupPrayersSlice.actions.clearGroupPrayers());
};

export default groupPrayersSlice.reducer;
