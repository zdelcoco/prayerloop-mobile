import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_API_URL } from './shared.types';
import { loginUser } from './login';

// Store reference - set via setupApiClient after store is created
let storeRef: any = null;
let loginSuccessAction: any = null;
let logoutSuccessAction: any = null;
let clearUserPrayersAction: any = null;
let clearUserGroupsAction: any = null;

// Flag to prevent concurrent re-login attempts
let isRefreshing = false;
// Queue of requests waiting for token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Setup function to inject store and actions (avoids circular dependency)
export const setupApiClient = (
  store: any,
  loginSuccess: any,
  logoutSuccess: any,
  clearUserPrayers: any,
  clearUserGroups: any
) => {
  storeRef = store;
  loginSuccessAction = loginSuccess;
  logoutSuccessAction = logoutSuccess;
  clearUserPrayersAction = clearUserPrayers;
  clearUserGroupsAction = clearUserGroups;
};

// Force logout - clears all state and kicks user to login
const forceLogout = () => {
  console.warn('[apiClient] Forcing logout - user will be redirected to login');
  if (storeRef && logoutSuccessAction && clearUserPrayersAction && clearUserGroupsAction) {
    storeRef.dispatch(logoutSuccessAction());
    storeRef.dispatch(clearUserPrayersAction());
    storeRef.dispatch(clearUserGroupsAction());
  }
};

// Attempt to re-login with saved credentials
const attemptReLogin = async (): Promise<string | null> => {
  try {
    const savedEmail = await AsyncStorage.getItem('rememberedEmail');
    const savedPassword = await AsyncStorage.getItem('rememberedPassword');

    if (!savedEmail || !savedPassword) {
      console.log('[apiClient] No saved credentials for re-login');
      return null;
    }

    console.log('[apiClient] Attempting re-login with saved credentials');
    const result = await loginUser(savedEmail, savedPassword);

    if (result.success && result.data) {
      console.log('[apiClient] Re-login successful');
      // Update Redux state with new token
      if (storeRef && loginSuccessAction) {
        storeRef.dispatch(loginSuccessAction(result.data));
      }
      return result.data.token;
    } else {
      console.warn('[apiClient] Re-login failed:', result.error?.message);
      return null;
    }
  } catch (error) {
    console.error('[apiClient] Re-login error:', error);
    return null;
  }
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

// Response interceptor to handle 401 errors with retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      console.warn('[apiClient] Received 401 response!', {
        url: originalRequest.url,
        method: originalRequest.method,
        errorMessage: (error.response?.data as any)?.error,
        hasAuthHeader: !!originalRequest.headers?.Authorization,
      });

      // Mark this request as already retried
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const newToken = await attemptReLogin();

        if (newToken) {
          // Update the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Process queued requests
          processQueue(null, newToken);

          console.log('[apiClient] Retrying original request with new token');
          // Retry the original request
          return apiClient(originalRequest);
        } else {
          // Re-login failed, force logout
          processQueue(new Error('Re-login failed'), null);
          forceLogout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Something went wrong, force logout
        processQueue(refreshError as Error, null);
        forceLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // For 401 on retry (second 401), or other errors, just reject
    if (error.response?.status === 401 && originalRequest?._retry) {
      console.warn('[apiClient] Second 401 after retry - forcing logout');
      forceLogout();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
