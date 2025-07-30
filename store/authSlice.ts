import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { User } from '../util/shared.types';
import { loginUser } from '../util/login';
import { LoginResponse } from '../util/login.types';
import { signupUser } from '../util/signup';
import { SignupRequest, SignupResponse } from '../util/signup.types';
import { clearUserPrayers } from './userPrayersSlice';
import { clearUserGroups } from './groupsSlice';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
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
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    signupStart: (state) => {
      state.status = 'loading';
    },
    signupSuccess: (state, action: PayloadAction<SignupResponse>) => {
      state.status = 'succeeded';
      state.error = null;
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.status = 'idle';
      state.isAuthenticated = false;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure, logoutSuccess } =
  authSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const login =
  (username: string, password: string): AppThunk =>
  async (dispatch) => {
    dispatch(loginStart());
    try {
      const result = await loginUser(username, password);
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

export const logout = (): AppThunk => (dispatch) => {
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
