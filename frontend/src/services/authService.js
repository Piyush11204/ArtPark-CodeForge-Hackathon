import api from './api';

export const authService = {
  // Returns { user, accessToken, refreshToken }
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }).then((r) => r.data.data),
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),
  getMe: () => api.get('/auth/me').then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
};
