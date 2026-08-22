import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const RENDER_BASE_URL = 'https://e-hrms-zl54.onrender.com/api/';

const memoryStore = {};

const api = axios.create({
  baseURL: RENDER_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Safe Storage Helper with Promise Timeout & Memory Fallback
export const getItemAsync = async (key) => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      return await SecureStore.getItemAsync(key);
    }
    return memoryStore[key] || null;
  } catch (e) {
    return memoryStore[key] || null;
  }
};

export const setItemAsync = async (key, value) => {
  try {
    memoryStore[key] = value;
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    console.error('Storage set error:', e);
  }
};

export const deleteItemAsync = async (key) => {
  try {
    delete memoryStore[key];
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.error('Storage delete error:', e);
  }
};

// Interceptor to attach JWT Token automatically
api.interceptors.request.use(
  async (config) => {
    const token = await getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
