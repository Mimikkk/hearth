const relativeRe = /^https?:\/\//i;
const isHostRelativeUrl = (path: string, url: string) => relativeRe.test(path) && /^\//.test(url);

const hostRe = /^https?:\/\/[^/]+/;
const isAbsoluteUrl = (url: string) => hostRe.test(url);
const dataUriRe = /^data:/i;
const isDataUri = (url: string) => dataUriRe.test(url);
const blobUriRe = /^blob:/i;
const isBlobUrl = (url: string) => blobUriRe.test(url);

export const LoaderUtils = {
  extractUrlBase(url: string): string {
    const index = url.lastIndexOf('/');

    if (index === -1) return './';

    return url.slice(0, index + 1);
  },
  resolveUrl(url: string, path: string): string {
    if (isHostRelativeUrl(path, url)) {
      path = path.replace(/(^https?:\/\/[^\/]+).*/i, '$1');
    }
    if (isAbsoluteUrl(url)) return url;
    if (isDataUri(url)) return url;
    if (isBlobUrl(url)) return url;
    return path + url;
  },
};
