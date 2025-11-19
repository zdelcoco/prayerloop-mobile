import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getUserPrayers } from '@/util/getUserPrayers';
import { GetUserPrayersResponse } from '@/util/getUserPrayers.types';

import { createUserPrayer } from '@/util/createUserPrayer';

import { updateUserPrayer } from '@/util/updateUserPrayer';

import { reorderUserPrayers, ReorderPrayersRequest } from '@/util/reorderUserPrayers';

import { Prayer, CreatePrayerRequest } from '@/util/shared.types';

export interface FilterOptions {
  createdBy?: number | null;
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  isAnswered?: boolean | null;
}

interface UserPrayersState {
  prayers: Prayer[] | null;
  status: 'idle' | 'loading' | 'creating' | 'updating' | 'reordering' | 'succeeded' | 'failed';
  error: string | null;
  searchQuery: string;
  filters: FilterOptions;
}

const initialState: UserPrayersState = {
  prayers: null,
  status: 'idle',
  error: null,
  searchQuery: '',
  filters: {
    createdBy: null,
    dateRange: 'all',
    isAnswered: null,
  },
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
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.filters = action.payload;
    },
    clearSearchAndFilters: (state) => {
      state.searchQuery = '';
      state.filters = {
        createdBy: null,
        dateRange: 'all',
        isAnswered: null,
      };
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
  setSearchQuery,
  setFilters,
  clearSearchAndFilters,
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

// Direct selectors (no memoization needed for simple property access)
export const selectUserPrayers = (state: RootState) => state.userPrayers.prayers;

export const selectUserPrayersState = (state: RootState) => state.userPrayers;

export const selectSearchQuery = (state: RootState) => state.userPrayers.searchQuery;

export const selectFilters = (state: RootState) => state.userPrayers.filters;

// Memoized selector for filtered prayers (actual transformation logic)
export const selectFilteredPrayers = createSelector(
  [
    (state: RootState) => state.userPrayers.prayers,
    (state: RootState) => state.userPrayers.searchQuery,
    (state: RootState) => state.userPrayers.filters,
  ],
  (prayers, searchQuery, filters) => {
    if (!prayers) return null;

    let filtered = [...prayers];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prayer) =>
          prayer.title.toLowerCase().includes(query) ||
          prayer.prayerDescription.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.createdBy !== null && filters.createdBy !== undefined) {
      filtered = filtered.filter((prayer) => prayer.createdBy === filters.createdBy);
    }

    if (filters.isAnswered !== null && filters.isAnswered !== undefined) {
      filtered = filtered.filter((prayer) => prayer.isAnswered === filters.isAnswered);
    }

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
          cutoffDate = new Date(0); // Beginning of time
      }

      filtered = filtered.filter((prayer) => {
        const createdDate = new Date(prayer.datetimeCreate);
        return createdDate >= cutoffDate;
      });
    }

    return filtered;
  }
);

export default userPrayersSlice.reducer;
