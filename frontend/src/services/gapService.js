import api from './api';

export const gapService = {
  // Returns { gapReportId, missing, partial, satisfied, gapScore, matchScore, ... }
  analyze: (resumeId, jobId) =>
    api.post('/gap/analyze', { resumeId, jobId }).then((r) => r.data.data),
  getById: (id) => api.get(`/gap/${id}`).then((r) => r.data.data),
  // Returns { reports, total, page, pages }
  getHistory: (params) => api.get('/gap/history', { params }).then((r) => r.data.data),
};

export const pathwayService = {
  // Returns the pathway document
  generate: (gapReportId) =>
    api.post('/pathway/generate', { gapReportId }).then((r) => r.data.data),
  getById: (id) => api.get(`/pathway/${id}`).then((r) => r.data.data),
  getMyPathways: () => api.get('/pathway/me').then((r) => r.data.data),
  updateStep: (pathwayId, stepId, status) =>
    api.patch(`/pathway/${pathwayId}/step/${stepId}`, { status }).then((r) => r.data.data),
};
