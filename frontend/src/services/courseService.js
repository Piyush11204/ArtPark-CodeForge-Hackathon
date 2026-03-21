import api from './api';

export const courseService = {
  /**
   * List courses with optional filters.
   * @param {Object} params - skill, level, category, q, page, limit
   */
  getCourses(params = {}) {
    return api.get('/courses', { params }).then((r) => r.data);
  },

  /** Get all courses for a specific skill, sorted beginner → advanced. */
  getCoursesBySkill(skill) {
    return api.get(`/courses/skill/${encodeURIComponent(skill)}`).then((r) => r.data.data);
  },

  /** Get a single course by its MongoDB _id. */
  getCourseById(id) {
    return api.get(`/courses/${id}`).then((r) => r.data.data);
  },

  /** Get category counts (for a filter UI). */
  getCategories() {
    return api.get('/courses/categories').then((r) => r.data.data);
  },
};
