import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Request interceptor: attach bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on an unauthenticated page
      const publicPaths = ['/login', '/register', '/forgot-password', '/'];
      const isPublicPath =
        publicPaths.includes(window.location.pathname) ||
        window.location.pathname.startsWith('/reset-password');

      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
