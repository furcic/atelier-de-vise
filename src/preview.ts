export const isStaticPreview = import.meta.env.VITE_STATIC_PREVIEW === 'true';
export const isMobileBuild = import.meta.env.VITE_NATIVE_APP === 'true';
/** Live native apps call the production API; the web build uses its own origin (''). */
export const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Public assets must resolve under the repository path on GitHub Pages. */
export function assetUrl(path: string) {
  // Uploaded photos live on the server; bundled /images/... stay local in the apps.
  if (apiOrigin && path.startsWith('/api/')) return `${apiOrigin}${path}`;
  return path.startsWith('/') && !path.startsWith('//')
    ? `${import.meta.env.BASE_URL}${path.slice(1)}`
    : path;
}
