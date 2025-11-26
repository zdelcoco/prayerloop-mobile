import userPrayersReducer, {
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
  FilterOptions,
} from '../userPrayersSlice';
import { Prayer } from '../../util/shared.types';
import { GetUserPrayersResponse } from '../../util/getUserPrayers.types';

describe('userPrayersSlice', () => {
  const initialState = {
    prayers: null,
    status: 'idle' as const,
    error: null,
    searchQuery: '',
    filters: {
      createdBy: null,
      dateRange: 'all' as const,
      isAnswered: null,
    },
  };

  const mockPrayer: Prayer = {
    prayerId: 1,
    title: 'Test Prayer',
    prayerDescription: 'Test prayer description',
    prayerType: 'standard',
    prayerAccessId: 1,
    prayerPriority: 1,
    userProfileId: 1,
    datetimeCreate: '2025-01-01T00:00:00Z',
    datetimeUpdate: '2025-01-01T00:00:00Z',
    createdBy: 1,
    updatedBy: 1,
    deleted: false,
    isAnswered: false,
    isPrivate: false,
    datetimeAnswered: null,
  };

  const mockPrayers: Prayer[] = [
    mockPrayer,
    { ...mockPrayer, prayerId: 2, title: 'Second Prayer', prayerDescription: 'Second prayer description' },
    { ...mockPrayer, prayerId: 3, title: 'Third Prayer', prayerDescription: 'Third prayer description' },
  ];

  const mockResponse: GetUserPrayersResponse = {
    message: 'Success',
    prayers: mockPrayers,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(userPrayersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('get user prayers flow', () => {
    it('should handle getUserPrayersStart', () => {
      const state = userPrayersReducer(initialState, getUserPrayersStart());
      expect(state.status).toBe('loading');
    });

    it('should handle getUserPrayersSuccess', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const state = userPrayersReducer(loadingState, getUserPrayersSuccess(mockResponse));

      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(mockPrayers);
      expect(state.prayers).toHaveLength(3);
    });

    it('should handle getUserPrayersFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Failed to fetch prayers';
      const state = userPrayersReducer(loadingState, getUserPrayersFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('create user prayer flow', () => {
    it('should handle createUserPrayerStart', () => {
      const state = userPrayersReducer(initialState, createUserPrayerStart());
      expect(state.status).toBe('creating');
    });

    it('should handle createUserPrayerSuccess', () => {
      const creatingState = { ...initialState, status: 'creating' as const };
      const state = userPrayersReducer(creatingState, createUserPrayerSuccess());

      expect(state.status).toBe('succeeded');
    });

    it('should handle createUserPrayerFailure', () => {
      const creatingState = { ...initialState, status: 'creating' as const };
      const errorMessage = 'Failed to create prayer';
      const state = userPrayersReducer(creatingState, createUserPrayerFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('update user prayer flow', () => {
    it('should handle updateUserPrayerStart', () => {
      const state = userPrayersReducer(initialState, updateUserPrayerStart());
      expect(state.status).toBe('updating');
    });

    it('should handle updateUserPrayerSuccess', () => {
      const updatingState = { ...initialState, status: 'updating' as const };
      const state = userPrayersReducer(updatingState, updateUserPrayerSuccess());

      expect(state.status).toBe('succeeded');
    });

    it('should handle updateUserPrayerFailure', () => {
      const updatingState = { ...initialState, status: 'updating' as const };
      const errorMessage = 'Failed to update prayer';
      const state = userPrayersReducer(updatingState, updateUserPrayerFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('reorder user prayers flow', () => {
    it('should handle reorderUserPrayersStart', () => {
      const state = userPrayersReducer(initialState, reorderUserPrayersStart());
      expect(state.status).toBe('reordering');
    });

    it('should handle reorderUserPrayersSuccess and update prayer order', () => {
      const stateWithPrayers = {
        ...initialState,
        prayers: mockPrayers,
        status: 'reordering' as const,
      };

      // Reorder prayers (reverse order)
      const reorderedPrayers = [...mockPrayers].reverse();
      const state = userPrayersReducer(
        stateWithPrayers,
        reorderUserPrayersSuccess(reorderedPrayers)
      );

      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(reorderedPrayers);
      expect(state.prayers?.[0].prayerId).toBe(3);
      expect(state.prayers?.[2].prayerId).toBe(1);
    });

    it('should handle reorderUserPrayersFailure', () => {
      const reorderingState = { ...initialState, status: 'reordering' as const };
      const errorMessage = 'Failed to reorder prayers';
      const state = userPrayersReducer(reorderingState, reorderUserPrayersFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('search and filters', () => {
    it('should handle setSearchQuery', () => {
      const state = userPrayersReducer(initialState, setSearchQuery('test prayer'));
      expect(state.searchQuery).toBe('test prayer');
    });

    it('should handle empty search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'test' };
      const state = userPrayersReducer(stateWithQuery, setSearchQuery(''));
      expect(state.searchQuery).toBe('');
    });

    it('should handle setFilters with all options', () => {
      const filters: FilterOptions = {
        createdBy: 1,
        dateRange: 'week',
        isAnswered: true,
      };

      const state = userPrayersReducer(initialState, setFilters(filters));
      expect(state.filters).toEqual(filters);
    });

    it('should handle setFilters with partial options', () => {
      const filters: FilterOptions = {
        createdBy: null,
        dateRange: 'month',
        isAnswered: null,
      };

      const state = userPrayersReducer(initialState, setFilters(filters));
      expect(state.filters).toEqual(filters);
      expect(state.filters.createdBy).toBeNull();
      expect(state.filters.dateRange).toBe('month');
      expect(state.filters.isAnswered).toBeNull();
    });

    it('should override previous filters', () => {
      const initialFilters = {
        ...initialState,
        filters: {
          createdBy: 1,
          dateRange: 'week' as const,
          isAnswered: true,
        },
      };

      const newFilters: FilterOptions = {
        createdBy: 2,
        dateRange: 'year',
        isAnswered: false,
      };

      const state = userPrayersReducer(initialFilters, setFilters(newFilters));
      expect(state.filters).toEqual(newFilters);
    });
  });

  describe('state transitions', () => {
    it('should transition through create prayer flow', () => {
      let state = userPrayersReducer(initialState, createUserPrayerStart());
      expect(state.status).toBe('creating');

      state = userPrayersReducer(state, createUserPrayerSuccess());
      expect(state.status).toBe('succeeded');
    });

    it('should transition through update prayer flow', () => {
      let state = userPrayersReducer(initialState, updateUserPrayerStart());
      expect(state.status).toBe('updating');

      state = userPrayersReducer(state, updateUserPrayerSuccess());
      expect(state.status).toBe('succeeded');
    });

    it('should transition through reorder flow', () => {
      let state = userPrayersReducer(initialState, reorderUserPrayersStart());
      expect(state.status).toBe('reordering');

      state = userPrayersReducer(state, reorderUserPrayersSuccess(mockPrayers));
      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(mockPrayers);
    });
  });

  describe('error handling', () => {
    it('should preserve prayers when fetch fails', () => {
      const stateWithPrayers = {
        ...initialState,
        prayers: mockPrayers,
        status: 'loading' as const,
      };

      const state = userPrayersReducer(
        stateWithPrayers,
        getUserPrayersFailure('Network error')
      );

      expect(state.status).toBe('failed');
      expect(state.error).toBe('Network error');
      expect(state.prayers).toEqual(mockPrayers);
    });

    it('should preserve search query and filters on error', () => {
      const stateWithFilters = {
        ...initialState,
        searchQuery: 'test',
        filters: {
          createdBy: 1,
          dateRange: 'week' as const,
          isAnswered: true,
        },
        status: 'loading' as const,
      };

      const state = userPrayersReducer(
        stateWithFilters,
        getUserPrayersFailure('Network error')
      );

      expect(state.searchQuery).toBe('test');
      expect(state.filters.createdBy).toBe(1);
      expect(state.filters.dateRange).toBe('week');
    });
  });
});
