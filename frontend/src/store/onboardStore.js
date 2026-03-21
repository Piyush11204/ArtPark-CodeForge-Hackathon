import { create } from 'zustand';

export const useOnboardStore = create((set) => ({
  resumeId: null,
  resumeData: null,
  selectedJob: null,
  gapReportId: null,
  gapReport: null,
  pathwayId: null,

  setResume: (resumeId, resumeData) => set({ resumeId, resumeData }),
  setJob: (job) => set({ selectedJob: job }),
  setGapReport: (gapReportId, gapReport) => set({ gapReportId, gapReport }),
  setPathway: (pathwayId) => set({ pathwayId }),
  reset: () => set({
    resumeId: null, resumeData: null, selectedJob: null,
    gapReportId: null, gapReport: null, pathwayId: null,
  }),
}));
