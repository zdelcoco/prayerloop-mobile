import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './authSlice';
import userPrayersReducer from './userPrayersSlice';
import userGroupsReducer from './groupsSlice';
import groupPrayersReducer from './groupPrayersSlice';
import groupUsersReducer from './groupUsersSlice';
import prayerSubjectsReducer from './prayerSubjectsSlice';

// Persist configuration for auth slice
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist these fields
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    userPrayers: userPrayersReducer,
    userGroups: userGroupsReducer,
    groupPrayers: groupPrayersReducer,
    groupUsers: groupUsersReducer,
    prayerSubjects: prayerSubjectsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;