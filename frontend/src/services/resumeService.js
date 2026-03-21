import api from './api';

export const resumeService = {
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    });
  },
  getMyResumes: () => api.get('/resume/me'),
  getById: (id) => api.get(`/resume/${id}`),
  deleteResume: (id) => api.delete(`/resume/${id}`),
};
