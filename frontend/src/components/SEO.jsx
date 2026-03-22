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

// Schema helpers live in utils/seoSchemas.js — import from there:
// import { buildJobListingSchema, buildCourseSchema, buildBreadcrumbSchema } from '../utils/seoSchemas';

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


