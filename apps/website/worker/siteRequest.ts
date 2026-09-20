type RequestFetcher = (request: Request) => Promise<Response>

const websiteContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
].join('; ')

interface SiteRequestDependencies {
  fetchProduct: RequestFetcher
  fetchWebsiteAsset: RequestFetcher
}

export async function handleSiteRequest(
  request: Request,
  dependencies: SiteRequestDependencies,
): Promise<Response> {
  const pathname = new URL(request.url).pathname
  if (pathname === '/conn' || pathname.startsWith('/conn/') === true) {
    return dependencies.fetchProduct(request)
  }

  let response = await dependencies.fetchWebsiteAsset(request)
  if (
    response.status === 404 &&
    isDocumentRequest(request) === true &&
    isStaticWebsitePath(pathname) === false
  ) {
    response = await dependencies.fetchWebsiteAsset(
      new Request(new URL('/index.html', request.url), request),
    )
    response = withStatus(response, pathname === '/' ? 200 : 404)
  }

  return addWebsiteHeaders(response, pathname)
}

function addWebsiteHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers)
  headers.set(
    'Cache-Control',
    isWebsiteAssetPath(pathname) && response.status === 200
      ? 'public, max-age=31536000, immutable, no-transform'
      : 'public, max-age=0, must-revalidate, no-transform',
  )
  headers.set('Content-Security-Policy', websiteContentSecurityPolicy)
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  if (response.status >= 400) {
    headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

function withStatus(response: Response, status: number): Response {
  return new Response(response.body, {
    headers: response.headers,
    status,
    statusText: response.statusText,
  })
}

function isWebsiteAssetPath(pathname: string): boolean {
  return pathname.startsWith('/assets/') === true
}

function isStaticWebsitePath(pathname: string): boolean {
  return (
    pathname === '/assets' ||
    pathname.startsWith('/assets/') === true ||
    pathname === '/licenses' ||
    pathname.startsWith('/licenses/') === true ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon-light.svg' ||
    pathname === '/favicon-dark.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt'
  )
}

function isDocumentRequest(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }

  return (
    request.headers.get('Sec-Fetch-Mode') === 'navigate' ||
    request.headers.get('Accept')?.includes('text/html') === true
  )
}
