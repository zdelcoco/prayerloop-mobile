import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { BASE_API_URL } from './shared.types';

// Store reference - set via setupApiClient after store is created
let storeRef: any = null;
let logoutSuccessAction: any = null;
let clearUserPrayersAction: any = null;
let clearUserGroupsAction: any = null;

// Setup function to inject store and actions (avoids circular dependency)
export const setupApiClient = (
  store: any,
  logoutSuccess: any,
  clearUserPrayers: any,
  clearUserGroups: any
) => {
  storeRef = store;
  logoutSuccessAction = logoutSuccess;
  clearUserPrayersAction = clearUserPrayers;
  clearUserGroupsAction = clearUserGroups;
};

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (storeRef) {
      const token = storeRef.getState().auth.token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('[apiClient] Missing token or headers!', {
          hasToken: !!token,
          hasHeaders: !!config.headers,
          url: config.url,
          method: config.method,
        });
      }
    } else {
      console.warn('[apiClient] storeRef not set!', {
        url: config.url,
        method: config.method,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token is invalid or expired - logout the user
      console.warn('[apiClient] Received 401 response!', {
        url: error.config?.url,
        method: error.config?.method,
        errorMessage: error.response?.data?.error,
        hasAuthHeader: !!error.config?.headers?.Authorization,
      });

      if (storeRef && logoutSuccessAction && clearUserPrayersAction && clearUserGroupsAction) {
        // Dispatch logout actions directly to store
        // Note: We use the sync actions here to avoid async issues
        storeRef.dispatch(logoutSuccessAction());
        storeRef.dispatch(clearUserPrayersAction());
        storeRef.dispatch(clearUserGroupsAction());
      }

      // Note: AsyncStorage cleanup for remembered credentials happens
      // when user explicitly logs out. For 401 errors, we keep credentials
      // so auto-login can be attempted on next app launch.
    }

    return Promise.reject(error);
  }
);

export default apiClient;
