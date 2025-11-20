import userGroupsReducer, {
  getUserGroupsStart,
  getUserGroupsSuccess,
  getUserGroupsFailure,
  createGroupStart,
  createGroupSuccess,
  createGroupFailure,
  leaveGroupStart,
  leaveGroupSuccess,
  leaveGroupFailure,
  deleteGroupStart,
  deleteGroupSuccess,
  deleteGroupFailure,
  reorderUserGroupsStart,
  reorderUserGroupsSuccess,
  reorderUserGroupsFailure,
  setGroupSearchQuery,
  setGroupFilters,
  clearGroupSearchAndFilters,
  GroupFilterOptions,
} from '../groupsSlice';
import { Group } from '../../util/shared.types';

describe('groupsSlice', () => {
  const initialState = {
    groups: null,
    status: 'idle' as const,
    error: null,
    searchQuery: '',
    filters: {
      dateRange: 'all' as const,
    },
  };

  const mockGroup: Group = {
    groupId: 1,
    groupName: 'Test Group',
    groupDescription: 'Test Description',
    datetimeCreate: '2025-01-01T00:00:00Z',
    datetimeUpdate: '2025-01-01T00:00:00Z',
    createdBy: 1,
    updatedBy: 1,
    deleted: false,
    isActive: true,
  };

  const mockGroups: Group[] = [
    mockGroup,
    { ...mockGroup, groupId: 2, groupName: 'Second Group' },
    { ...mockGroup, groupId: 3, groupName: 'Third Group' },
  ];

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(userGroupsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('get user groups flow', () => {
    it('should handle getUserGroupsStart', () => {
      const state = userGroupsReducer(initialState, getUserGroupsStart());
      expect(state.status).toBe('loading');
    });

    it('should handle getUserGroupsSuccess', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const state = userGroupsReducer(loadingState, getUserGroupsSuccess(mockGroups));

      expect(state.status).toBe('succeeded');
      expect(state.groups).toEqual(mockGroups);
      expect(state.groups).toHaveLength(3);
    });

    it('should handle getUserGroupsFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Failed to fetch groups';
      const state = userGroupsReducer(loadingState, getUserGroupsFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('create group flow', () => {
    it('should handle createGroupStart', () => {
      const state = userGroupsReducer(initialState, createGroupStart());
      expect(state.status).toBe('creating');
    });

    it('should handle createGroupSuccess', () => {
      const creatingState = { ...initialState, status: 'creating' as const };
      const state = userGroupsReducer(creatingState, createGroupSuccess());

      expect(state.status).toBe('succeeded');
    });

    it('should handle createGroupFailure', () => {
      const creatingState = { ...initialState, status: 'creating' as const };
      const errorMessage = 'Failed to create group';
      const state = userGroupsReducer(creatingState, createGroupFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('leave group flow', () => {
    it('should handle leaveGroupStart', () => {
      const state = userGroupsReducer(initialState, leaveGroupStart());
      expect(state.status).toBe('loading');
    });

    it('should handle leaveGroupSuccess and remove group from state', () => {
      const stateWithGroups = {
        ...initialState,
        groups: mockGroups,
        status: 'loading' as const,
      };

      const state = userGroupsReducer(stateWithGroups, leaveGroupSuccess(2));

      expect(state.status).toBe('succeeded');
      expect(state.groups).toHaveLength(2);
      expect(state.groups?.find((g) => g.groupId === 2)).toBeUndefined();
      expect(state.groups?.find((g) => g.groupId === 1)).toBeDefined();
      expect(state.groups?.find((g) => g.groupId === 3)).toBeDefined();
    });

    it('should handle leaveGroupSuccess with no groups in state', () => {
      const state = userGroupsReducer(initialState, leaveGroupSuccess(1));
      expect(state.status).toBe('succeeded');
      expect(state.groups).toBeNull();
    });

    it('should handle leaveGroupFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Failed to leave group';
      const state = userGroupsReducer(loadingState, leaveGroupFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('delete group flow', () => {
    it('should handle deleteGroupStart', () => {
      const state = userGroupsReducer(initialState, deleteGroupStart());
      expect(state.status).toBe('loading');
    });

    it('should handle deleteGroupSuccess and remove group from state', () => {
      const stateWithGroups = {
        ...initialState,
        groups: mockGroups,
        status: 'loading' as const,
      };

      const state = userGroupsReducer(stateWithGroups, deleteGroupSuccess(1));

      expect(state.status).toBe('succeeded');
      expect(state.groups).toHaveLength(2);
      expect(state.groups?.find((g) => g.groupId === 1)).toBeUndefined();
      expect(state.groups?.find((g) => g.groupId === 2)).toBeDefined();
      expect(state.groups?.find((g) => g.groupId === 3)).toBeDefined();
    });

    it('should handle deleteGroupSuccess with no groups in state', () => {
      const state = userGroupsReducer(initialState, deleteGroupSuccess(1));
      expect(state.status).toBe('succeeded');
      expect(state.groups).toBeNull();
    });

    it('should handle deleteGroupFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Failed to delete group';
      const state = userGroupsReducer(loadingState, deleteGroupFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('reorder user groups flow', () => {
    it('should handle reorderUserGroupsStart', () => {
      const state = userGroupsReducer(initialState, reorderUserGroupsStart());
      expect(state.status).toBe('reordering');
    });

    it('should handle reorderUserGroupsSuccess and update group order', () => {
      const stateWithGroups = {
        ...initialState,
        groups: mockGroups,
        status: 'reordering' as const,
      };

      // Reorder groups (reverse order)
      const reorderedGroups = [...mockGroups].reverse();
      const state = userGroupsReducer(
        stateWithGroups,
        reorderUserGroupsSuccess(reorderedGroups)
      );

      expect(state.status).toBe('succeeded');
      expect(state.groups).toEqual(reorderedGroups);
      expect(state.groups?.[0].groupId).toBe(3);
      expect(state.groups?.[2].groupId).toBe(1);
    });

    it('should handle reorderUserGroupsFailure', () => {
      const reorderingState = { ...initialState, status: 'reordering' as const };
      const errorMessage = 'Failed to reorder groups';
      const state = userGroupsReducer(reorderingState, reorderUserGroupsFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('search and filters', () => {
    it('should handle setGroupSearchQuery', () => {
      const state = userGroupsReducer(initialState, setGroupSearchQuery('test group'));
      expect(state.searchQuery).toBe('test group');
    });

    it('should handle empty search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'test' };
      const state = userGroupsReducer(stateWithQuery, setGroupSearchQuery(''));
      expect(state.searchQuery).toBe('');
    });

    it('should handle setGroupFilters', () => {
      const filters: GroupFilterOptions = {
        dateRange: 'month',
      };

      const state = userGroupsReducer(initialState, setGroupFilters(filters));
      expect(state.filters).toEqual(filters);
      expect(state.filters.dateRange).toBe('month');
    });

    it('should override previous filters', () => {
      const initialFilters = {
        ...initialState,
        filters: {
          dateRange: 'week' as const,
        },
      };

      const newFilters: GroupFilterOptions = {
        dateRange: 'year',
      };

      const state = userGroupsReducer(initialFilters, setGroupFilters(newFilters));
      expect(state.filters).toEqual(newFilters);
    });

    it('should handle clearGroupSearchAndFilters', () => {
      const stateWithFilters = {
        ...initialState,
        searchQuery: 'test group',
        filters: {
          dateRange: 'month' as const,
        },
      };

      const state = userGroupsReducer(stateWithFilters, clearGroupSearchAndFilters());

      expect(state.searchQuery).toBe('');
      expect(state.filters.dateRange).toBe('all');
    });
  });

  describe('state transitions', () => {
    it('should transition through create group flow', () => {
      let state = userGroupsReducer(initialState, createGroupStart());
      expect(state.status).toBe('creating');

      state = userGroupsReducer(state, createGroupSuccess());
      expect(state.status).toBe('succeeded');
    });

    it('should transition through leave group flow', () => {
      const stateWithGroups = { ...initialState, groups: mockGroups };

      let state = userGroupsReducer(stateWithGroups, leaveGroupStart());
      expect(state.status).toBe('loading');

      state = userGroupsReducer(state, leaveGroupSuccess(1));
      expect(state.status).toBe('succeeded');
      expect(state.groups).toHaveLength(2);
    });

    it('should transition through delete group flow', () => {
      const stateWithGroups = { ...initialState, groups: mockGroups };

      let state = userGroupsReducer(stateWithGroups, deleteGroupStart());
      expect(state.status).toBe('loading');

      state = userGroupsReducer(state, deleteGroupSuccess(2));
      expect(state.status).toBe('succeeded');
      expect(state.groups).toHaveLength(2);
    });

    it('should transition through reorder flow', () => {
      let state = userGroupsReducer(initialState, reorderUserGroupsStart());
      expect(state.status).toBe('reordering');

      state = userGroupsReducer(state, reorderUserGroupsSuccess(mockGroups));
      expect(state.status).toBe('succeeded');
      expect(state.groups).toEqual(mockGroups);
    });
  });

  describe('error handling', () => {
    it('should preserve groups when fetch fails', () => {
      const stateWithGroups = {
        ...initialState,
        groups: mockGroups,
        status: 'loading' as const,
      };

      const state = userGroupsReducer(
        stateWithGroups,
        getUserGroupsFailure('Network error')
      );

      expect(state.status).toBe('failed');
      expect(state.error).toBe('Network error');
      expect(state.groups).toEqual(mockGroups);
    });

    it('should preserve search query and filters on error', () => {
      const stateWithFilters = {
        ...initialState,
        searchQuery: 'test',
        filters: {
          dateRange: 'week' as const,
        },
        status: 'loading' as const,
      };

      const state = userGroupsReducer(stateWithFilters, getUserGroupsFailure('Network error'));

      expect(state.searchQuery).toBe('test');
      expect(state.filters.dateRange).toBe('week');
    });
  });
});
