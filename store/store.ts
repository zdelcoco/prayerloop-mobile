import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userPrayersReducer from './userPrayersSlice';
import userGroupsReducer from './groupsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    userPrayers: userPrayersReducer,
    userGroups: userGroupsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;