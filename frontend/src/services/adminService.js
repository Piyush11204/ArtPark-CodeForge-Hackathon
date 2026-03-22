import api from './api';

// Analytics
export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data.data);

// User Management
export const getAdminUsers = (params = {}) =>
  api.get('/admin/users', { params }).then((r) => r.data.data);

export const getAdminUser = (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data);

export const updateAdminUser = (id, payload) =>
  api.patch(`/admin/users/${id}`, payload).then((r) => r.data.data);

export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

// Job Management
export const getAdminJobs = (params = {}) =>
  api.get('/admin/jobs', { params }).then((r) => r.data.data);

export const createAdminJob = (payload) =>
  api.post('/admin/jobs', payload).then((r) => r.data.data);

export const updateAdminJob = (id, payload) =>
  api.patch(`/admin/jobs/${id}`, payload).then((r) => r.data.data);

export const deleteAdminJob = (id) => api.delete(`/admin/jobs/${id}`).then((r) => r.data);

export const toggleAdminJob = (id) =>
  api.patch(`/admin/jobs/${id}/toggle`).then((r) => r.data.data);

// Course Management
export const getAdminCourses = (params = {}) =>
  api.get('/admin/courses', { params }).then((r) => r.data.data);

export const createAdminCourse = (payload) =>
  api.post('/admin/courses', payload).then((r) => r.data.data);

export const updateAdminCourse = (id, payload) =>
  api.patch(`/admin/courses/${id}`, payload).then((r) => r.data.data);

export const deleteAdminCourse = (id) => api.delete(`/admin/courses/${id}`).then((r) => r.data);

export const toggleAdminCourse = (id) =>
  api.patch(`/admin/courses/${id}/toggle`).then((r) => r.data.data);
