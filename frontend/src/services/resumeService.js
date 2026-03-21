import api from './api';

export const resumeService = {
  // formData must already have the file appended under field 'file'
  // Returns { resumeId, normalizedSkills, parsedData }
  upload: (formData) =>
    api
      .post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      })
      .then((r) => r.data.data),
  // Update parsedData (post-edit confirmation)
  update: (id, parsedData) =>
    api.patch(`/resume/${id}`, { parsedData }).then((r) => r.data.data),
  // Returns array of resume docs
  getMyResumes: () => api.get('/resume/me').then((r) => r.data.data),
  getById: (id) => api.get(`/resume/${id}`).then((r) => r.data.data),
  deleteResume: (id) => api.delete(`/resume/${id}`).then((r) => r.data),
};
