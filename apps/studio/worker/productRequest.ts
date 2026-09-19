const productPath = '/conn'

const productContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' http: https: ws: wss:",
].join('; ')

type RequestFetcher = (request: Request) => Promise<Response>

interface ProductRequestDependencies {
  fetchAsset: RequestFetcher
}

export async function handleProductRequest(
  request: Request,
  dependencies: ProductRequestDependencies,
): Promise<Response> {
  const url = new URL(request.url)
  if (isProductPath(url.pathname) === false) {
    return addProductHeaders(new Response(null, { status: 404 }), url.pathname)
  }

  const assetRequest = createAssetRequest(request, url)
  let response = await dependencies.fetchAsset(assetRequest)

  if (
    response.status === 404 &&
    isDocumentRequest(request) === true &&
    isStaticProductPath(url.pathname) === false
  ) {
    const indexUrl = new URL('/index.html', request.url)
    response = await dependencies.fetchAsset(new Request(indexUrl, request))
  }

  return addProductHeaders(response, url.pathname)
}

function isProductPath(pathname: string): boolean {
  return pathname === productPath || pathname.startsWith(`${productPath}/`)
}

function isStaticProductPath(pathname: string): boolean {
  return (
    pathname === `${productPath}/assets` ||
    pathname.startsWith(`${productPath}/assets/`) === true ||
    pathname === `${productPath}/brand` ||
    pathname.startsWith(`${productPath}/brand/`) === true ||
    pathname === `${productPath}/favicon.ico` ||
    pathname === `${productPath}/favicon-light.svg` ||
    pathname === `${productPath}/favicon-dark.svg`
  )
}

function createAssetRequest(request: Request, url: URL): Request {
  const assetUrl = new URL(url)
  const assetPath = url.pathname.slice(productPath.length)
  assetUrl.pathname = assetPath.length === 0 || assetPath === '/' ? '/' : assetPath
  return new Request(assetUrl, request)
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

function addProductHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', productContentSecurityPolicy)
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')

  if (pathname.startsWith(`${productPath}/assets/`) === true && response.status === 200) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable, no-transform')
  } else if (headers.get('Content-Type')?.includes('text/html') === true) {
    // Browsers revalidate the shell while the edge can reuse it briefly. Deployments must retain
    // hashed assets long enough for an older shell to finish its cache lifetime.
    headers.set(
      'Cache-Control',
      'public, max-age=0, s-maxage=300, stale-while-revalidate=60, no-transform',
    )
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
