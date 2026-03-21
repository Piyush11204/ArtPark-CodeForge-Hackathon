import api from './api';

export const gapService = {
  analyze: (resumeId, jobId) => api.post('/gap/analyze', { resumeId, jobId }),
  getById: (id) => api.get(`/gap/${id}`),
  getHistory: (params) => api.get('/gap/history', { params }),
};

export const pathwayService = {
  generate: (gapReportId) => api.post('/pathway/generate', { gapReportId }),
  getById: (id) => api.get(`/pathway/${id}`),
  getMyPathways: () => api.get('/pathway/me'),
  updateStep: (pathwayId, stepId, status) =>
    api.patch(`/pathway/${pathwayId}/step/${stepId}`, { status }),
};
