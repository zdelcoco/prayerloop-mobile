import groupPrayersReducer, {
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
  GroupPrayerFilterOptions,
} from '../groupPrayersSlice';
import { Prayer } from '../../util/shared.types';

describe('groupPrayersSlice', () => {
  const initialState = {
    groupProfileId: 0,
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
    title: 'Group Prayer',
    prayerDescription: 'Group prayer description',
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
    { ...mockPrayer, prayerId: 2, title: 'Second Group Prayer', prayerDescription: 'Second group prayer description' },
    { ...mockPrayer, prayerId: 3, title: 'Third Group Prayer', prayerDescription: 'Third group prayer description' },
  ];

  const mockResponse = {
    groupProfileId: 1,
    prayers: mockPrayers,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(groupPrayersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('get group prayers flow', () => {
    it('should handle getGroupPrayersStart', () => {
      const state = groupPrayersReducer(initialState, getGroupPrayersStart());
      expect(state.status).toBe('loading');
    });

    it('should handle getGroupPrayersSuccess', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const state = groupPrayersReducer(loadingState, getGroupPrayersSuccess(mockResponse));

      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(mockPrayers);
      expect(state.groupProfileId).toBe(1);
      expect(state.prayers).toHaveLength(3);
    });

    it('should handle getGroupPrayersSuccess and update groupProfileId', () => {
      const stateWithDifferentGroup = {
        ...initialState,
        groupProfileId: 2,
        prayers: [mockPrayer],
      };

      const state = groupPrayersReducer(
        stateWithDifferentGroup,
        getGroupPrayersSuccess(mockResponse)
      );

      expect(state.groupProfileId).toBe(1);
      expect(state.prayers).toEqual(mockPrayers);
    });

    it('should handle getGroupPrayersFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Failed to fetch group prayers';
      const state = groupPrayersReducer(loadingState, getGroupPrayersFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('create group prayer flow', () => {
    it('should handle createGroupPrayerStart', () => {
      const state = groupPrayersReducer(initialState, createGroupPrayerStart());
      expect(state.status).toBe('creating');
    });

    it('should handle createGroupPrayerSuccess', () => {
      const creatingState = { ...initialState, status: 'creating' as const };
      const state = groupPrayersReducer(creatingState, createGroupPrayerSuccess());

      expect(state.status).toBe('succeeded');
    });

    it('should handle createGroupPrayerFailure', () => {
      const creatingState = { ...initialState, status: 'creating' as const };
      const errorMessage = 'Failed to create group prayer';
      const state = groupPrayersReducer(creatingState, createGroupPrayerFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('reorder group prayers flow', () => {
    it('should handle reorderGroupPrayersStart', () => {
      const state = groupPrayersReducer(initialState, reorderGroupPrayersStart());
      expect(state.status).toBe('reordering');
    });

    it('should handle reorderGroupPrayersSuccess and update prayer order', () => {
      const stateWithPrayers = {
        ...initialState,
        groupProfileId: 1,
        prayers: mockPrayers,
        status: 'reordering' as const,
      };

      // Reorder prayers (reverse order)
      const reorderedPrayers = [...mockPrayers].reverse();
      const state = groupPrayersReducer(
        stateWithPrayers,
        reorderGroupPrayersSuccess(reorderedPrayers)
      );

      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(reorderedPrayers);
      expect(state.prayers?.[0].prayerId).toBe(3);
      expect(state.prayers?.[2].prayerId).toBe(1);
      expect(state.groupProfileId).toBe(1); // Should be preserved
    });

    it('should handle reorderGroupPrayersFailure', () => {
      const reorderingState = { ...initialState, status: 'reordering' as const };
      const errorMessage = 'Failed to reorder group prayers';
      const state = groupPrayersReducer(
        reorderingState,
        reorderGroupPrayersFailure(errorMessage)
      );

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('search and filters', () => {
    it('should handle setGroupPrayerSearchQuery', () => {
      const state = groupPrayersReducer(
        initialState,
        setGroupPrayerSearchQuery('test prayer')
      );
      expect(state.searchQuery).toBe('test prayer');
    });

    it('should handle empty search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'test' };
      const state = groupPrayersReducer(stateWithQuery, setGroupPrayerSearchQuery(''));
      expect(state.searchQuery).toBe('');
    });

    it('should handle setGroupPrayerFilters with all options', () => {
      const filters: GroupPrayerFilterOptions = {
        createdBy: 1,
        dateRange: 'week',
        isAnswered: true,
      };

      const state = groupPrayersReducer(initialState, setGroupPrayerFilters(filters));
      expect(state.filters).toEqual(filters);
    });

    it('should handle setGroupPrayerFilters with partial options', () => {
      const filters: GroupPrayerFilterOptions = {
        createdBy: null,
        dateRange: 'month',
        isAnswered: null,
      };

      const state = groupPrayersReducer(initialState, setGroupPrayerFilters(filters));
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

      const newFilters: GroupPrayerFilterOptions = {
        createdBy: 2,
        dateRange: 'year',
        isAnswered: false,
      };

      const state = groupPrayersReducer(initialFilters, setGroupPrayerFilters(newFilters));
      expect(state.filters).toEqual(newFilters);
    });

    it('should handle clearGroupPrayerSearchAndFilters', () => {
      const stateWithFilters = {
        ...initialState,
        searchQuery: 'test prayer',
        filters: {
          createdBy: 1,
          dateRange: 'month' as const,
          isAnswered: true,
        },
      };

      const state = groupPrayersReducer(stateWithFilters, clearGroupPrayerSearchAndFilters());

      expect(state.searchQuery).toBe('');
      expect(state.filters.createdBy).toBeNull();
      expect(state.filters.dateRange).toBe('all');
      expect(state.filters.isAnswered).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should transition through create prayer flow', () => {
      let state = groupPrayersReducer(initialState, createGroupPrayerStart());
      expect(state.status).toBe('creating');

      state = groupPrayersReducer(state, createGroupPrayerSuccess());
      expect(state.status).toBe('succeeded');
    });

    it('should transition through reorder flow', () => {
      let state = groupPrayersReducer(initialState, reorderGroupPrayersStart());
      expect(state.status).toBe('reordering');

      state = groupPrayersReducer(state, reorderGroupPrayersSuccess(mockPrayers));
      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(mockPrayers);
    });

    it('should transition through fetch flow', () => {
      let state = groupPrayersReducer(initialState, getGroupPrayersStart());
      expect(state.status).toBe('loading');

      state = groupPrayersReducer(state, getGroupPrayersSuccess(mockResponse));
      expect(state.status).toBe('succeeded');
      expect(state.prayers).toEqual(mockPrayers);
      expect(state.groupProfileId).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should preserve prayers when fetch fails', () => {
      const stateWithPrayers = {
        ...initialState,
        groupProfileId: 1,
        prayers: mockPrayers,
        status: 'loading' as const,
      };

      const state = groupPrayersReducer(
        stateWithPrayers,
        getGroupPrayersFailure('Network error')
      );

      expect(state.status).toBe('failed');
      expect(state.error).toBe('Network error');
      expect(state.prayers).toEqual(mockPrayers);
      expect(state.groupProfileId).toBe(1);
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

      const state = groupPrayersReducer(
        stateWithFilters,
        getGroupPrayersFailure('Network error')
      );

      expect(state.searchQuery).toBe('test');
      expect(state.filters.createdBy).toBe(1);
      expect(state.filters.dateRange).toBe('week');
    });
  });

  describe('group switching', () => {
    it('should update groupProfileId when fetching different group prayers', () => {
      const stateWithGroup1 = {
        ...initialState,
        groupProfileId: 1,
        prayers: mockPrayers,
      };

      const group2Response = {
        groupProfileId: 2,
        prayers: [mockPrayer],
      };

      const state = groupPrayersReducer(stateWithGroup1, getGroupPrayersSuccess(group2Response));

      expect(state.groupProfileId).toBe(2);
      expect(state.prayers).toEqual([mockPrayer]);
    });

  });
});
