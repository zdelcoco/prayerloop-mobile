import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';

import {
  getPrayerSubjects,
  createPrayerSubject,
  updatePrayerSubject,
  deletePrayerSubject,
  reorderPrayerSubjects,
  GetPrayerSubjectsResponse,
  ReorderPrayerSubjectsRequest,
} from '@/util/prayerSubjects';

import {
  PrayerSubject,
  CreatePrayerSubjectRequest,
  UpdatePrayerSubjectRequest,
} from '@/util/shared.types';

type SubjectTypeFilter = 'all' | 'individual' | 'family' | 'group';

interface PrayerSubjectsState {
  subjects: PrayerSubject[] | null;
  status:
    | 'idle'
    | 'loading'
    | 'creating'
    | 'updating'
    | 'deleting'
    | 'reordering'
    | 'succeeded'
    | 'failed';
  error: string | null;
  searchQuery: string;
  typeFilter: SubjectTypeFilter;
  // Used to pass newly created contact ID back to PrayerModal
  pendingNewContactId: number | null;
}

const initialState: PrayerSubjectsState = {
  subjects: null,
  status: 'idle',
  error: null,
  searchQuery: '',
  typeFilter: 'all',
  pendingNewContactId: null,
};

const prayerSubjectsSlice = createSlice({
  name: 'prayerSubjects',
  initialState,
  reducers: {
    getPrayerSubjectsStart: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    getPrayerSubjectsSuccess: (
      state,
      action: PayloadAction<GetPrayerSubjectsResponse>
    ) => {
      state.status = 'succeeded';
      state.subjects = action.payload.prayerSubjects;
      state.error = null;
    },
    getPrayerSubjectsFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    createPrayerSubjectStart: (state) => {
      state.status = 'creating';
    },
    createPrayerSubjectSuccess: (state) => {
      state.status = 'succeeded';
    },
    createPrayerSubjectFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    updatePrayerSubjectStart: (state) => {
      state.status = 'updating';
    },
    updatePrayerSubjectSuccess: (state) => {
      state.status = 'succeeded';
    },
    updatePrayerSubjectFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    deletePrayerSubjectStart: (state) => {
      state.status = 'deleting';
    },
    deletePrayerSubjectSuccess: (state) => {
      state.status = 'succeeded';
    },
    deletePrayerSubjectFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    reorderPrayerSubjectsStart: (state) => {
      state.status = 'reordering';
    },
    reorderPrayerSubjectsSuccess: (
      state,
      action: PayloadAction<PrayerSubject[]>
    ) => {
      state.status = 'succeeded';
      state.subjects = action.payload;
    },
    reorderPrayerSubjectsFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearPrayerSubjects: (state) => {
      state.status = 'idle';
      state.subjects = null;
      state.error = null;
      state.searchQuery = '';
      state.typeFilter = 'all';
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setTypeFilter: (state, action: PayloadAction<SubjectTypeFilter>) => {
      state.typeFilter = action.payload;
    },
    clearSearchAndFilters: (state) => {
      state.searchQuery = '';
      state.typeFilter = 'all';
    },
    setPendingNewContactId: (state, action: PayloadAction<number | null>) => {
      state.pendingNewContactId = action.payload;
    },
    clearPendingNewContactId: (state) => {
      state.pendingNewContactId = null;
    },
  },
});

export const {
  getPrayerSubjectsStart,
  getPrayerSubjectsSuccess,
  getPrayerSubjectsFailure,
  createPrayerSubjectStart,
  createPrayerSubjectSuccess,
  createPrayerSubjectFailure,
  updatePrayerSubjectStart,
  updatePrayerSubjectSuccess,
  updatePrayerSubjectFailure,
  deletePrayerSubjectStart,
  deletePrayerSubjectSuccess,
  deletePrayerSubjectFailure,
  reorderPrayerSubjectsStart,
  reorderPrayerSubjectsSuccess,
  reorderPrayerSubjectsFailure,
  setSearchQuery,
  setTypeFilter,
  clearSearchAndFilters,
  setPendingNewContactId,
  clearPendingNewContactId,
} = prayerSubjectsSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const fetchPrayerSubjects = (): AppThunk => async (dispatch, getState) => {
  const { auth, prayerSubjects } = getState();
  if (!auth.isAuthenticated || !auth.token || !auth.user) {
    dispatch(getPrayerSubjectsFailure('User not authenticated'));
    return;
  }

  if (prayerSubjects.status === 'loading') {
    console.log('fetchPrayerSubjects already in progress.');
    return;
  }

  dispatch(getPrayerSubjectsStart());
  try {
    const result = await getPrayerSubjects(auth.token, auth.user.userProfileId);
    if (result.success) {
      dispatch(getPrayerSubjectsSuccess(result.data as GetPrayerSubjectsResponse));
    } else {
      dispatch(
        getPrayerSubjectsFailure(result.error?.message || 'An error occurred.')
      );
    }
  } catch {
    dispatch(getPrayerSubjectsFailure('An error occurred.'));
  }
};

export const addPrayerSubject =
  (subjectRequest: CreatePrayerSubjectRequest): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(createPrayerSubjectFailure('User not authenticated'));
      return;
    }

    dispatch(createPrayerSubjectStart());

    try {
      const result = await createPrayerSubject(
        auth.token,
        auth.user.userProfileId,
        subjectRequest
      );
      if (result.success) {
        dispatch(createPrayerSubjectSuccess());
        dispatch(fetchPrayerSubjects());
      } else {
        dispatch(
          createPrayerSubjectFailure(
            result.error?.message || 'An error occurred.'
          )
        );
      }
    } catch {
      dispatch(createPrayerSubjectFailure('An error occurred.'));
    }
  };

export const putPrayerSubject =
  (prayerSubjectId: number, subjectData: UpdatePrayerSubjectRequest): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(updatePrayerSubjectFailure('User not authenticated'));
      return;
    }

    dispatch(updatePrayerSubjectStart());

    try {
      const result = await updatePrayerSubject(
        auth.token,
        prayerSubjectId,
        subjectData
      );
      if (result.success) {
        dispatch(updatePrayerSubjectSuccess());
        dispatch(fetchPrayerSubjects());
      } else {
        dispatch(
          updatePrayerSubjectFailure(
            result.error?.message || 'An error occurred.'
          )
        );
      }
    } catch {
      dispatch(updatePrayerSubjectFailure('An error occurred.'));
    }
  };

export const removePrayerSubject =
  (prayerSubjectId: number, reassignToSelf: boolean = true): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(deletePrayerSubjectFailure('User not authenticated'));
      return;
    }

    dispatch(deletePrayerSubjectStart());

    try {
      const result = await deletePrayerSubject(
        auth.token,
        prayerSubjectId,
        reassignToSelf
      );
      if (result.success) {
        dispatch(deletePrayerSubjectSuccess());
        dispatch(fetchPrayerSubjects());
      } else {
        dispatch(
          deletePrayerSubjectFailure(
            result.error?.message || 'An error occurred.'
          )
        );
      }
    } catch {
      dispatch(deletePrayerSubjectFailure('An error occurred.'));
    }
  };

export const reorderSubjects =
  (reorderedSubjects: PrayerSubject[]): AppThunk =>
  async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.token || !auth.user) {
      dispatch(reorderPrayerSubjectsFailure('User not authenticated'));
      return;
    }

    dispatch(reorderPrayerSubjectsStart());

    // Optimistically update the local state
    dispatch(reorderPrayerSubjectsSuccess(reorderedSubjects));

    try {
      const reorderData: ReorderPrayerSubjectsRequest = {
        prayerSubjects: reorderedSubjects.map((subject, index) => ({
          prayerSubjectId: subject.prayerSubjectId,
          displaySequence: index,
        })),
      };

      const result = await reorderPrayerSubjects(
        auth.token,
        auth.user.userProfileId,
        reorderData
      );

      if (!result.success) {
        // Revert on failure by refetching
        dispatch(fetchPrayerSubjects());
        dispatch(
          reorderPrayerSubjectsFailure(
            result.error?.message || 'An error occurred.'
          )
        );
      }
    } catch {
      // Revert on failure by refetching
      dispatch(fetchPrayerSubjects());
      dispatch(reorderPrayerSubjectsFailure('An error occurred.'));
    }
  };

export const clearPrayerSubjects = (): AppThunk => async (dispatch) => {
  dispatch(prayerSubjectsSlice.actions.clearPrayerSubjects());
};

// Direct selectors
export const selectPrayerSubjects = (state: RootState) =>
  state.prayerSubjects.subjects;

export const selectPrayerSubjectsState = (state: RootState) =>
  state.prayerSubjects;

export const selectSearchQuery = (state: RootState) =>
  state.prayerSubjects.searchQuery;

export const selectTypeFilter = (state: RootState) =>
  state.prayerSubjects.typeFilter;

// Memoized selector for filtered subjects
export const selectFilteredPrayerSubjects = createSelector(
  [
    (state: RootState) => state.prayerSubjects.subjects,
    (state: RootState) => state.prayerSubjects.searchQuery,
    (state: RootState) => state.prayerSubjects.typeFilter,
  ],
  (subjects, searchQuery, typeFilter) => {
    if (!subjects) return null;

    let filtered = [...subjects];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(
        (subject) => subject.prayerSubjectType === typeFilter
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (subject) =>
          subject.prayerSubjectDisplayName.toLowerCase().includes(query) ||
          subject.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }
);

// Selector to get a single subject by ID
export const selectPrayerSubjectById = (prayerSubjectId: number) =>
  createSelector([selectPrayerSubjects], (subjects) =>
    subjects?.find((s) => s.prayerSubjectId === prayerSubjectId)
  );

// Selector to get total prayer count across all subjects
export const selectTotalPrayerCount = createSelector(
  [selectPrayerSubjects],
  (subjects) =>
    subjects?.reduce((total, subject) => total + (subject.prayers?.length || 0), 0) || 0
);

// Selector for pending new contact ID (used when returning from AddPrayerCardModal)
export const selectPendingNewContactId = (state: RootState) =>
  state.prayerSubjects.pendingNewContactId;

export default prayerSubjectsSlice.reducer;
