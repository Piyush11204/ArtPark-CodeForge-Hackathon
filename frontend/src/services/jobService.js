import api from './api';

export const jobService = {
  getJobs: (params) => api.get('/jobs', { params }),
  searchJobs: (q, params) => api.get('/jobs/search', { params: { q, ...params } }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  getCategories: () => api.get('/jobs/categories'),
};
