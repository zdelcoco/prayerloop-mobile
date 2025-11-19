import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import { getGroupPrayers } from '../util/getGroupPrayers';
import { createGroupPrayer } from '../util/createGroupPrayer';
import { reorderGroupPrayers, ReorderPrayersRequest } from '../util/reorderGroupPrayers';
import { Prayer, CreatePrayerRequest } from '../util/shared.types';

export interface GroupPrayerFilterOptions {
  createdBy?: number | null;
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  isAnswered?: boolean | null;
}

interface GroupPrayersResponse {
  groupProfileId: number;
  prayers: Prayer[];
}

interface GroupPrayersState {
  groupProfileId: number;
  prayers: Prayer[] | null;
  status: 'idle' | 'loading' | 'creating' | 'reordering' | 'succeeded' | 'failed';
  error: string | null;
  searchQuery: string;
  filters: GroupPrayerFilterOptions;
}

const initialState: GroupPrayersState = {
  groupProfileId: 0,
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
    setGroupPrayerSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setGroupPrayerFilters: (state, action: PayloadAction<GroupPrayerFilterOptions>) => {
      state.filters = action.payload;
    },
    clearGroupPrayerSearchAndFilters: (state) => {
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
  getGroupPrayersStart,
  getGroupPrayersSuccess,
  getGroupPrayersFailure,
  createGroupPrayerStart,
  createGroupPrayerSuccess,
  createGroupPrayerFailure,
  reorderGroupPrayersStart,
  reorderGroupPrayersSuccess,
  reorderGroupPrayersFailure,
  setGroupPrayerSearchQuery,
  setGroupPrayerFilters,
  clearGroupPrayerSearchAndFilters,
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

// Direct selectors
export const selectGroupPrayers = (state: RootState) =>
  state.groupPrayers.prayers;
export const selectGroupPrayersStatus = (state: RootState) =>
  state.groupPrayers.status;
export const selectGroupPrayersError = (state: RootState) =>
  state.groupPrayers.error;

export const selectGroupPrayerSearchQuery = (state: RootState) =>
  state.groupPrayers.searchQuery;

export const selectGroupPrayerFilters = (state: RootState) =>
  state.groupPrayers.filters;

// Memoized selector for filtered group prayers
export const selectFilteredGroupPrayers = createSelector(
  [
    (state: RootState) => state.groupPrayers.prayers,
    (state: RootState) => state.groupPrayers.searchQuery,
    (state: RootState) => state.groupPrayers.filters,
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
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter((prayer) => {
        const createdDate = new Date(prayer.datetimeCreate);
        return createdDate >= cutoffDate;
      });
    }

    return filtered;
  }
);

export const clearGroupPrayers = (): AppThunk => async (dispatch) => {
  dispatch(groupPrayersSlice.actions.clearGroupPrayers());
};

export default groupPrayersSlice.reducer;
