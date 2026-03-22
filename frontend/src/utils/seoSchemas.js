// Schema.org JSON-LD structured data helpers.
// Import from here — not from SEO.jsx — to keep Fast Refresh happy.

const BASE_URL = 'https://hireready-9lkl.onrender.com';

/** Job listing page — ItemList of JobPosting */
export function buildJobListingSchema(jobs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tech Job Listings on AdaptLearn',
    description: 'Curated tech job opportunities matched to your skill profile.',
    numberOfItems: jobs.length,
    itemListElement: jobs.slice(0, 20).map((job, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        description: job.description || job.summary,
        datePosted: job.createdAt || new Date().toISOString(),
        employmentType: job.type || 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company || 'Unknown Company',
        },
        jobLocation: {
          '@type': 'Place',
          address: job.location || 'Remote',
        },
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills,
      },
    })),
  };
}

/** Single course structured data */
export function buildCourseSchema(course) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.platform || 'AdaptLearn',
    },
    url: course.url,
    inLanguage: 'en',
    isAccessibleForFree: true,
  };
}

/** Breadcrumb trail */
export function buildBreadcrumbSchema(crumbs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.path}`,
    })),
  };
}
