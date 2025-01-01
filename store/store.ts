import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userPrayersReducer from './userPrayersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    userPrayers: userPrayersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;