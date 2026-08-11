const LOCAL_APP_URL = "http://localhost:3000";

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedRequestHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  );
}

export function getAppUrl(request?: Request): string {
  if (process.env.APP_URL) return normalizeUrl(process.env.APP_URL);

  if (request) {
    const requestUrl = new URL(request.url);
    if (isAllowedRequestHost(requestUrl.hostname)) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto");
      if (forwardedHost && forwardedProto) {
        const forwardedUrl = new URL(`${forwardedProto}://${forwardedHost}`);
        if (isAllowedRequestHost(forwardedUrl.hostname)) {
          return normalizeUrl(forwardedUrl.origin);
        }
      }
      return normalizeUrl(requestUrl.origin);
    }
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  }

  return LOCAL_APP_URL;
}
