/**
 * SEO.jsx — Per-page meta tag management using React 19 native document
 * metadata hoisting. React 19 automatically hoists <title>, <meta>, and
 * <link> tags rendered anywhere in the component tree into <head>.
 * No external library required — zero peer-dep conflicts.
 *
 * Usage:
 *   <SEO
 *     title="Browse Jobs"
 *     description="Explore hundreds of tech job listings matched to your skill profile."
 *     path="/jobs"
 *   />
 */
import { useEffect } from 'react';

const BASE_URL = 'https://hireready-9lkl.onrender.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'AdaptLearn';

export default function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  imageAlt = 'AdaptLearn — AI career development platform',
  type = 'website',
  noIndex = false,
  structuredData = null,
  keywords = '',
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — AI Skill Gap Analysis & Learning Roadmap Engine`;
  const canonical = `${BASE_URL}${path}`;

  // Inject / remove JSON-LD structured data via useEffect.
  // React 19 hoists <title>/<meta>/<link> natively but not raw <script> blocks.
  useEffect(() => {
    if (!structuredData) return;

    const id = `ld-json-${path.replace(/\//g, '-') || 'home'}`;
    // Remove stale script from a previous render of this route
    document.getElementById(id)?.remove();

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [structuredData, path]);

  // React 19 hoists these tags to <head> and deduplicates them automatically.
  return (
    <>
      {/* ── Primary ─────────────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large'}
      />

      {/* ── Open Graph ──────────────────────────────────────────────── */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* ── Twitter Card ────────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Structured data helpers (pass result as structuredData prop to <SEO>)
───────────────────────────────────────────────────────────────────────── */

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


const BASE_URL = 'https://hireready-9lkl.onrender.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'AdaptLearn';

export default function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  imageAlt = 'AdaptLearn — AI career development platform',
  type = 'website',
  noIndex = false,
  structuredData = null,
  keywords = '',
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — AI Skill Gap Analysis & Learning Roadmap Engine`;
  const canonical = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Inline structured data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}

/* ─────────────────────────────────────────────────────────────
   Pre-built structured data helpers
───────────────────────────────────────────────────────────── */

/** Job listing structured data (for /jobs page) */
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

/** Course / learning resource structured data */
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

/** Breadcrumb schema helper */
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
