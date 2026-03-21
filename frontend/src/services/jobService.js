import api from './api';

export const jobService = {
  // Returns { jobs, pagination: { total, pages, page, limit } }
  getJobs: (params) => api.get('/jobs', { params }).then((r) => r.data.data),
  // Returns { jobs, query, pagination }
  searchJobs: (q, params = {}) =>
    api.get('/jobs/search', { params: { q, ...params } }).then((r) => r.data.data),
  getJobById: (id) => api.get(`/jobs/${id}`).then((r) => r.data.data),
  // Returns { companies, jobTypes, workTypes, locations }
  getCategories: () => api.get('/jobs/categories').then((r) => r.data.data),
};
