import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getUserPrayers } from '@/util/getUserPrayers';
import { GetUserPrayersResponse } from '@/util/getUserPrayers.types';

import { createUserPrayer } from '@/util/createUserPrayer';

import { updateUserPrayer } from '@/util/updateUserPrayer';

import { reorderUserPrayers, ReorderPrayersRequest } from '@/util/reorderUserPrayers';

import { Prayer, CreatePrayerRequest } from '@/util/shared.types';

interface UserPrayersState {
  prayers: Prayer[] | null;
  status: 'idle' | 'loading' | 'creating' | 'updating' | 'reordering' | 'succeeded' | 'failed';
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
    getUserPrayersSuccess: (
      state,
      action: PayloadAction<GetUserPrayersResponse>
    ) => {
      state.status = 'succeeded';
      state.prayers = action.payload.prayers;
    },
    getUserPrayersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    createUserPrayerStart: (state) => {
      state.status = 'creating';
    },
    createUserPrayerSuccess: (state) => {
      state.status = 'succeeded';
    },
    createUserPrayerFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    updateUserPrayerStart: (state) => {
      state.status = 'updating';
    },
    updateUserPrayerSuccess: (state) => {
      state.status = 'succeeded';
    },
    updateUserPrayerFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    reorderUserPrayersStart: (state) => {
      state.status = 'reordering';
    },
    reorderUserPrayersSuccess: (state, action: PayloadAction<Prayer[]>) => {
      state.status = 'succeeded';
      state.prayers = action.payload;
    },
    reorderUserPrayersFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearUserPrayers: (state) => {
      state.status = 'idle';
      state.prayers = null;
      state.error = null;
    },
  },
});

export const {
  getUserPrayersStart,
  getUserPrayersSuccess,
  getUserPrayersFailure,
  createUserPrayerStart,
  createUserPrayerSuccess,
  createUserPrayerFailure,
  updateUserPrayerStart,
  updateUserPrayerSuccess,
  updateUserPrayerFailure,
  reorderUserPrayersStart,
  reorderUserPrayersSuccess,
  reorderUserPrayersFailure,
} = userPrayersSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const fetchUserPrayers = (): AppThunk => async (dispatch, getState) => {
  const { auth, userPrayers } = getState();
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    dispatch(getUserPrayersFailure('User not authenticated'));
    return;
  }

  if (userPrayers.status === 'loading') {
    console.log('fetchUserPrayers already in progress.');
    return; // Avoid duplicate calls
  }

  dispatch(getUserPrayersStart());
  try {
    const result = await getUserPrayers(auth.token, auth.user.userProfileId);
    if (result.success) {
      dispatch(getUserPrayersSuccess(result.data as GetUserPrayersResponse));
    } else {
      dispatch(
        getUserPrayersFailure(result.error?.message || 'An error occurred.')
      );
    }
  } catch (error) {
    dispatch(getUserPrayersFailure('An error occurred.'));
  }
};

export const addUserPrayer =
  (prayerRequest: CreatePrayerRequest): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(createUserPrayerFailure('User not authenticated'));
      return;
    }

    dispatch(createUserPrayerStart());

    try {
      const result = await createUserPrayer(
        auth.token,
        auth.user.userProfileId,
        prayerRequest
      );
      if (result.success) {
        dispatch(createUserPrayerSuccess());
        dispatch(fetchUserPrayers());
      } else {
        dispatch(
          createUserPrayerFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      dispatch(createUserPrayerFailure('An error occurred.'));
    }
  };

export const putUserPrayer =
  (prayerId: number, prayerData: CreatePrayerRequest): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(updateUserPrayerFailure('User not authenticated'));
      return;
    }

    dispatch(updateUserPrayerStart());

    try {
      const result = await updateUserPrayer(auth.token, prayerId, prayerData);
      if (result.success) {
        dispatch(updateUserPrayerSuccess());
        dispatch(fetchUserPrayers());
      } else {
        dispatch(
          updateUserPrayerFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      dispatch(updateUserPrayerFailure('An error occurred.'));
    }
  };

export const reorderPrayers =
  (reorderedPrayers: Prayer[]): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(reorderUserPrayersFailure('User not authenticated'));
      return;
    }

    dispatch(reorderUserPrayersStart());

    // Optimistically update the local state
    dispatch(reorderUserPrayersSuccess(reorderedPrayers));

    try {
      const reorderData: ReorderPrayersRequest = {
        prayers: reorderedPrayers.map((prayer, index) => ({
          prayerId: prayer.prayerId,
          displaySequence: index,
        })),
      };

      const result = await reorderUserPrayers(
        auth.token,
        auth.user.userProfileId,
        reorderData
      );

      if (!result.success) {
        // Revert on failure by refetching
        dispatch(fetchUserPrayers());
        dispatch(
          reorderUserPrayersFailure(result.error?.message || 'An error occurred.')
        );
      }
    } catch (error) {
      // Revert on failure by refetching
      dispatch(fetchUserPrayers());
      dispatch(reorderUserPrayersFailure('An error occurred.'));
    }
  };

export const clearUserPrayers = (): AppThunk => async (dispatch) => {
  dispatch(userPrayersSlice.actions.clearUserPrayers());
};

export const selectUserPrayers = createSelector(
  (state: RootState) => state.userPrayers.prayers,
  (prayers) => prayers
);

export const selectUserPrayersState = (state: RootState) => state.userPrayers;

export default userPrayersSlice.reducer;
