import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { jwtDecode } from 'jwt-decode';
import { RootState } from './store';
import { User } from '../util/shared.types';
import { loginUser } from '../util/login';
import { LoginResponse } from '../util/login.types';
import { signupUser } from '../util/signup';
import { SignupRequest, SignupResponse } from '../util/signup.types';
import { clearUserPrayers } from './userPrayersSlice';
import { clearUserGroups } from './groupsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { groupUsersCache } from '../util/groupUsersCache';

interface JWTPayload {
  exp: number;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isTokenValidated: boolean; // Tracks whether token validation has completed
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isTokenValidated: false,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.status = 'loading';
    },
    loginSuccess: (state, action: PayloadAction<LoginResponse>) => {
      state.status = 'succeeded';
      state.isAuthenticated = true;
      state.isTokenValidated = true; // Fresh login = valid token
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
      // Clear auth state on login failure to prevent stale persisted state
      // from allowing access to authenticated screens
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    },
    signupStart: (state) => {
      state.status = 'loading';
    },
    signupSuccess: (state, _: PayloadAction<SignupResponse>) => {
      state.status = 'succeeded';
      state.error = null;
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.isAuthenticated = false;
      // Keep isTokenValidated true so navigation can proceed to login screen
      // The flag will be reset on app restart via initialState
      state.isTokenValidated = true;
    },
    tokenValidationComplete: (state) => {
      state.isTokenValidated = true;
    },
    updateUserProfileSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure, logoutSuccess, tokenValidationComplete, updateUserProfileSuccess } =
  authSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const login =
  (email: string, password: string): AppThunk =>
  async (dispatch) => {
    dispatch(loginStart());
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        dispatch(loginSuccess(result.data));
      } else {
        dispatch(
          loginFailure(result.error?.message || 'An unknown error occurred')
        );
      }
    } catch (error) {
      dispatch(loginFailure('An unknown error occurred'));
    }
  };

export const signup =
  (signupData: SignupRequest): AppThunk =>
  async (dispatch) => {
    dispatch(signupStart());
    try {
      const result = await signupUser(signupData);
      if (result.success) {
        dispatch(signupSuccess(result.data));
      } else {
        dispatch(
          signupFailure(result.error?.message || 'An unknown error occurred')
        );
      }
    } catch (error) {
      dispatch(signupFailure('An unknown error occurred'));
    }
  };

export const validateToken = (): AppThunk => async (dispatch, getState) => {
  const { token } = getState().auth;

  if (!token) {
    // No token, try auto-login with saved credentials
    await attemptAutoLogin(dispatch);
    dispatch(tokenValidationComplete());
    return;
  }

  try {
    // Decode JWT to check expiration
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000; // Convert to seconds

    if (decoded.exp < currentTime) {
      // Token is expired, attempt auto-login with saved credentials
      console.log('Token expired, attempting auto-login');
      await attemptAutoLogin(dispatch);
    }
    // Token is valid (or auto-login attempted), mark validation complete
    dispatch(tokenValidationComplete());
  } catch (error) {
    // Invalid token format, attempt auto-login
    console.error('Invalid token, attempting auto-login:', error);
    await attemptAutoLogin(dispatch);
    dispatch(tokenValidationComplete());
  }
};

// Helper function to attempt auto-login with saved credentials
const attemptAutoLogin = async (dispatch: any) => {
  try {
    const savedEmail = await AsyncStorage.getItem('rememberedEmail');
    const savedPassword = await AsyncStorage.getItem('rememberedPassword');

    if (savedEmail && savedPassword) {
      // Attempt auto-login with saved credentials
      console.log('Attempting auto-login with saved credentials');
      await dispatch(login(savedEmail, savedPassword));
      // If login succeeds, user stays authenticated
      // If it fails, loginFailure will be dispatched and user goes to login screen
    } else {
      // No saved credentials, logout to show login screen
      console.log('No saved credentials, logging out');
      dispatch(logout());
    }
  } catch (error) {
    console.error('Auto-login failed:', error);
    dispatch(logout());
  }
};

export const logout = (): AppThunk => async (dispatch) => {
  // Clear saved credentials from AsyncStorage
  try {
    await AsyncStorage.removeItem('rememberedEmail');
    await AsyncStorage.removeItem('rememberedPassword');
  } catch (error) {
    console.error('Error clearing saved credentials on logout:', error);
  }

  // Clear group users cache to prevent stale data when switching users
  groupUsersCache.clear();

  dispatch(logoutSuccess());
  dispatch(clearUserPrayers());
  dispatch(clearUserGroups());
};

export const selectAuthState = (state: RootState) => state.auth;

export const memoizedAuthSelector = createSelector(selectAuthState, (auth) => ({
  error: auth.error,
  status: auth.status,
}));

export default authSlice.reducer;
