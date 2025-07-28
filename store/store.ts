import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userPrayersReducer from './userPrayersSlice';
import userGroupsReducer from './groupsSlice';
import groupPrayersReducer from './groupPrayersSlice';
import groupUsersReducer from './groupUsersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    userPrayers: userPrayersReducer,
    userGroups: userGroupsReducer,
    groupPrayers: groupPrayersReducer,
    groupUsers: groupUsersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;