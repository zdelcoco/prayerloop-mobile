import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { RootState } from './store';
import { loginUser } from '../util/login';


// Define types
interface User {
  // Define user properties here
  id: string;
  username: string;
  // Add other user properties as needed
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Define initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
};

// Create the slice
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

// Export actions
export const { loginStart, loginSuccess, loginFailure, logoutSuccess } = authSlice.actions;

// Define AppThunk type
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  PayloadAction<any>
>;

// Async thunk action
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

// Sync action
export const logout = (): AppThunk => (dispatch) => {
  dispatch(logoutSuccess());
};

// Selector
export const selectAuthState = (state: RootState) => state.auth;

export const memoizedAuthSelector = createSelector(selectAuthState, (auth) => ({
  error: auth.error,
  status: auth.status,
}));

export default authSlice.reducer;
