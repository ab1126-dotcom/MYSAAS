import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get stored subscription status
const getSubscription = () => localStorage.getItem('subscription') || 'free';
const getUserId = () => {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
  }
  return id;
};

// Create axios instance with default headers
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120s for AI calls
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - add auth headers
api.interceptors.request.use((config) => {
  const subscription = getSubscription();
  const userId = getUserId();
  config.headers['x-subscription'] = subscription;
  config.headers['x-user-id'] = userId;
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message || 
                    'Something went wrong';
    
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    enhancedError.upgradeRequired = error.response?.data?.upgradeRequired;
    
    return Promise.reject(enhancedError);
  }
);

// API functions
export const analyzeVideo = (url) => 
  api.post('/analyze', { url, isPaid: getSubscription() === 'paid' });

export const getUsage = () => 
  api.get('/analyze/usage');

export const generateHooks = (clipData, videoTitle) =>
  api.post('/clips/hooks', { clipData, videoTitle, isPaid: getSubscription() === 'paid' });

export const generateSEO = (videoData, clipData) =>
  api.post('/clips/seo', { videoData, clipData, isPaid: getSubscription() === 'paid' });

export const analyzeComments = (url) =>
  api.post('/comments/analyze', { url, isPaid: getSubscription() === 'paid' });

export const setSubscription = (plan) => {
  localStorage.setItem('subscription', plan);
};

export const isPaidUser = () => getSubscription() === 'paid';

export default api;
