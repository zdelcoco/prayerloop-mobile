import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  signupStart,
  signupSuccess,
  signupFailure,
  logoutSuccess,
  tokenValidationComplete,
  updateUserProfileSuccess,
  login,
  validateToken,
  logout,
} from '../authSlice';
import { User } from '../../util/shared.types';
import { LoginResponse } from '../../util/login.types';
import { SignupResponse } from '../../util/signup.types';
import * as loginUtil from '../../util/login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Mock dependencies
jest.mock('../../util/login');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('jwt-decode');

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isTokenValidated: false,
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
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('login thunk', () => {
    const getState = jest.fn();

    it('should dispatch loginSuccess on successful login', async () => {
      const dispatch = jest.fn();
      const mockLoginUser = loginUtil.loginUser as jest.MockedFunction<typeof loginUtil.loginUser>;

      mockLoginUser.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });

      await login('testuser', 'password')(dispatch, getState, undefined);

      expect(dispatch).toHaveBeenCalledWith(loginStart());
      expect(dispatch).toHaveBeenCalledWith(loginSuccess(mockLoginResponse));
      expect(mockLoginUser).toHaveBeenCalledWith('testuser', 'password');
    });

    it('should dispatch loginFailure on failed login', async () => {
      const dispatch = jest.fn();
      const mockLoginUser = loginUtil.loginUser as jest.MockedFunction<typeof loginUtil.loginUser>;

      mockLoginUser.mockResolvedValue({
        success: false,
        error: { type: 'InvalidCredentials', message: 'Invalid credentials' },
      });

      await login('testuser', 'wrongpassword')(dispatch, getState, undefined);

      expect(dispatch).toHaveBeenCalledWith(loginStart());
      expect(dispatch).toHaveBeenCalledWith(loginFailure('Invalid credentials'));
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
    it('should handle logoutSuccess and clear auth state', () => {
      const authenticatedState = {
        user: mockUser,
        token: 'mock-jwt-token',
        isAuthenticated: true,
        isTokenValidated: true,
        status: 'succeeded' as const,
        error: null,
      };

      const state = authReducer(authenticatedState, logoutSuccess());

      expect(state.user).toBeNull();
      expect(state.status).toBe('idle');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear AsyncStorage credentials on logout', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn();
      const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;

      await logout()(dispatch, getState, undefined);

      expect(mockRemoveItem).toHaveBeenCalledWith('rememberedEmail');
      expect(mockRemoveItem).toHaveBeenCalledWith('rememberedPassword');
      expect(dispatch).toHaveBeenCalledWith(logoutSuccess());
    });
  });

  describe('user profile update', () => {
    it('should handle updateUserProfileSuccess', () => {
      const authenticatedState = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
        isTokenValidated: true,
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
  });

  describe('validateToken thunk', () => {
    const createMockState = (authState: any) => ({
      auth: authState,
      userPrayers: { prayers: [], status: 'idle' as const, error: null, searchQuery: '', filters: {} },
      userGroups: { groups: [], status: 'idle' as const, error: null, searchQuery: '', filters: {} },
      groupPrayers: {},
      groupUsers: {},
    });

    it('should dispatch tokenValidationComplete if token is valid', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn(() => createMockState({
        token: 'valid-token',
        isAuthenticated: true,
        isTokenValidated: false,
        user: null,
        status: 'idle' as const,
        error: null,
      })) as any;

      const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
      mockJwtDecode.mockReturnValue({
        exp: Date.now() / 1000 + 3600, // Expires in 1 hour
      });

      await validateToken()(dispatch, getState, undefined);

      // Should dispatch tokenValidationComplete when token is valid
      expect(dispatch).toHaveBeenCalledWith(tokenValidationComplete());
    });

    it('should attempt auto-login if token is expired and credentials exist', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn(() => createMockState({
        token: 'expired-token',
        isAuthenticated: true,
        isTokenValidated: false,
        user: null,
        status: 'idle' as const,
        error: null,
      })) as any;

      const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
      const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
      const mockLoginUser = loginUtil.loginUser as jest.MockedFunction<typeof loginUtil.loginUser>;

      mockJwtDecode.mockReturnValue({
        exp: Date.now() / 1000 - 3600, // Expired 1 hour ago
      });

      mockGetItem.mockImplementation((key: string) => {
        if (key === 'rememberedEmail') return Promise.resolve('test@example.com');
        if (key === 'rememberedPassword') return Promise.resolve('password');
        return Promise.resolve(null);
      });

      mockLoginUser.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });

      await validateToken()(dispatch, getState, undefined);

      expect(mockGetItem).toHaveBeenCalledWith('rememberedEmail');
      expect(mockGetItem).toHaveBeenCalledWith('rememberedPassword');
      expect(dispatch).toHaveBeenCalled(); // Should dispatch login actions
    });

    it('should logout if token is expired and no credentials exist', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn(() => createMockState({
        token: 'expired-token',
        isAuthenticated: true,
        isTokenValidated: false,
        user: null,
        status: 'idle' as const,
        error: null,
      })) as any;

      const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
      const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

      mockJwtDecode.mockReturnValue({
        exp: Date.now() / 1000 - 3600, // Expired 1 hour ago
      });

      mockGetItem.mockResolvedValue(null); // No saved credentials

      await validateToken()(dispatch, getState, undefined);

      expect(dispatch).toHaveBeenCalled();
    });

    it('should attempt auto-login if no token exists and credentials exist', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn(() => createMockState({
        token: null,
        isAuthenticated: false,
        isTokenValidated: false,
        user: null,
        status: 'idle' as const,
        error: null,
      })) as any;

      const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
      const mockLoginUser = loginUtil.loginUser as jest.MockedFunction<typeof loginUtil.loginUser>;

      mockGetItem.mockImplementation((key: string) => {
        if (key === 'rememberedEmail') return Promise.resolve('test@example.com');
        if (key === 'rememberedPassword') return Promise.resolve('password');
        return Promise.resolve(null);
      });

      mockLoginUser.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });

      await validateToken()(dispatch, getState, undefined);

      expect(mockGetItem).toHaveBeenCalledWith('rememberedEmail');
      expect(mockGetItem).toHaveBeenCalledWith('rememberedPassword');
      expect(dispatch).toHaveBeenCalled();
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
        isTokenValidated: true,
        status: 'succeeded' as const,
        error: null,
      };

      const state = authReducer(authenticatedState, logoutSuccess());
      expect(state.status).toBe('idle');
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
