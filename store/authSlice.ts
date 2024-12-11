import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { loginUser } from '../util/login';

interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
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
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.status = 'succeeded';
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
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

export const { loginStart, loginSuccess, loginFailure, logoutSuccess } = authSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

export const login = (username: string, password: string): AppThunk => async (dispatch) => {
  dispatch(loginStart());
  try {
    const result = await loginUser(username, password);
    if (result.success) {
      dispatch(loginSuccess(result.data));
    } else {
      dispatch(loginFailure(result.error?.message || 'An unknown error occurred'));
    }
  } catch (error) {
    dispatch(loginFailure('An unknown error occurred'));
  }
};

export const logout = (): AppThunk => (dispatch) => {
  dispatch(logoutSuccess());
};

export const selectAuthState = (state: RootState) => state.auth;

export const memoizedAuthSelector = createSelector(selectAuthState, (auth) => ({
  error: auth.error,
  status: auth.status,
}));

export default authSlice.reducer;
