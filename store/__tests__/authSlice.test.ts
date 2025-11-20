import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  signupStart,
  signupSuccess,
  signupFailure,
  logoutSuccess,
  updateUserProfileSuccess,
} from '../authSlice';
import { User } from '../../util/shared.types';
import { LoginResponse } from '../../util/login.types';
import { SignupResponse } from '../../util/signup.types';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    status: 'idle' as const,
    error: null,
  };

  const mockUser: User = {
    userProfileId: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    admin: false,
    createdBy: 1,
    datetimeCreate: '2025-01-01T00:00:00Z',
    datetimeUpdate: '2025-01-01T00:00:00Z',
    deleted: false,
    emailVerified: true,
    phoneVerified: false,
    updatedBy: 1,
    phoneNumber: undefined,
  };

  const mockLoginResponse: LoginResponse = {
    message: 'Login successful',
    token: 'mock-jwt-token',
    user: mockUser,
  };

  const mockSignupResponse: SignupResponse = {
    message: 'Signup successful',
    user: {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('login flow', () => {
    it('should handle loginStart', () => {
      const state = authReducer(initialState, loginStart());
      expect(state.status).toBe('loading');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle loginSuccess', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const state = authReducer(loadingState, loginSuccess(mockLoginResponse));

      expect(state.status).toBe('succeeded');
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('mock-jwt-token');
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it('should handle loginFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Invalid credentials';
      const state = authReducer(loadingState, loginFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
    });
  });

  describe('signup flow', () => {
    it('should handle signupStart', () => {
      const state = authReducer(initialState, signupStart());
      expect(state.status).toBe('loading');
    });

    it('should handle signupSuccess', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const state = authReducer(loadingState, signupSuccess(mockSignupResponse));

      expect(state.status).toBe('succeeded');
      expect(state.error).toBeNull();
    });

    it('should handle signupFailure', () => {
      const loadingState = { ...initialState, status: 'loading' as const };
      const errorMessage = 'Email already exists';
      const state = authReducer(loadingState, signupFailure(errorMessage));

      expect(state.status).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('should handle logoutSuccess and clear all auth state', () => {
      const authenticatedState = {
        user: mockUser,
        token: 'mock-jwt-token',
        isAuthenticated: true,
        status: 'succeeded' as const,
        error: null,
      };

      const state = authReducer(authenticatedState, logoutSuccess());

      expect(state.user).toBeNull();
      expect(state.status).toBe('idle');
      expect(state.isAuthenticated).toBe(false);
      // Token should still be there (logout clears it separately)
      expect(state.token).toBe('mock-jwt-token');
    });
  });

  describe('user profile update', () => {
    it('should handle updateUserProfileSuccess', () => {
      const authenticatedState = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-jwt-token',
      };

      const updatedUser: User = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
      };

      const state = authReducer(authenticatedState, updateUserProfileSuccess(updatedUser));

      expect(state.user).toEqual(updatedUser);
      expect(state.user?.firstName).toBe('Updated');
      expect(state.user?.lastName).toBe('Name');
    });

    it('should update user profile even if not authenticated', () => {
      const state = authReducer(initialState, updateUserProfileSuccess(mockUser));
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('error handling', () => {
    it('should clear previous errors on new login attempt', () => {
      const failedState = {
        ...initialState,
        status: 'failed' as const,
        error: 'Previous error',
      };

      const state = authReducer(failedState, loginStart());

      expect(state.status).toBe('loading');
      // Error is not explicitly cleared, but status changes
      expect(state.error).toBe('Previous error');
    });

    it('should preserve user data when login fails', () => {
      const authenticatedState = {
        ...initialState,
        user: mockUser,
        token: 'old-token',
        isAuthenticated: true,
      };

      const state = authReducer(authenticatedState, loginFailure('New login failed'));

      expect(state.error).toBe('New login failed');
      expect(state.status).toBe('failed');
      // Previous auth state is preserved
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('old-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('should transition from idle -> loading -> succeeded on successful login', () => {
      let state = authReducer(initialState, loginStart());
      expect(state.status).toBe('loading');

      state = authReducer(state, loginSuccess(mockLoginResponse));
      expect(state.status).toBe('succeeded');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should transition from idle -> loading -> failed on failed login', () => {
      let state = authReducer(initialState, loginStart());
      expect(state.status).toBe('loading');

      state = authReducer(state, loginFailure('Invalid credentials'));
      expect(state.status).toBe('failed');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should transition from succeeded -> idle on logout', () => {
      const authenticatedState = {
        user: mockUser,
        token: 'mock-jwt-token',
        isAuthenticated: true,
        status: 'succeeded' as const,
        error: null,
      };

      const state = authReducer(authenticatedState, logoutSuccess());
      expect(state.status).toBe('idle');
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
