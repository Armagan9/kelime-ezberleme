import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const isAuthEndpoint = (err.config?.url || '').includes('/auth/');
    // Sadece korumalı isteklerde (oturum süresi dolunca) login'e yönlendir.
    // Login/kayıt gibi auth isteklerinin 401'ini sayfa kendisi gösterir.
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
