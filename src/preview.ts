export const isStaticPreview = import.meta.env.VITE_STATIC_PREVIEW === 'true';

/** Public assets must resolve under the repository path on GitHub Pages. */
export function assetUrl(path: string) {
  return path.startsWith('/') && !path.startsWith('//')
    ? `${import.meta.env.BASE_URL}${path.slice(1)}`
    : path;
}
