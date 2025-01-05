import { configureStore } from '@reduxjs/toolkit';
//import { composeWithDevTools } from 'redux-devtools-extension';
import authReducer from './authSlice';
import userPrayersReducer from './userPrayersSlice';
import userGroupsReducer from './groupsSlice';
import groupPrayersReducer from './groupPrayersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    userPrayers: userPrayersReducer,
    userGroups: userGroupsReducer,
    groupPrayers: groupPrayersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;