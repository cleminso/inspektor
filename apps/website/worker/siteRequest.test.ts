import { describe, expect, it, vi } from 'vitest'

import { handleSiteRequest } from './siteRequest'

describe('website Worker routing', () => {
  it.each(['/conn', '/conn/', '/conn/new', '/conn/assets/app.js'])(
    'dispatches %s to the product Worker',
    async (pathname) => {
      const fetchProduct = vi.fn(async (_request: Request) => new Response('product'))
      const fetchWebsiteAsset = vi.fn(async (_request: Request) => new Response('website'))
      const request = new Request(`https://inspektor.dev${pathname}`)

      const response = await handleSiteRequest(request, { fetchProduct, fetchWebsiteAsset })

      expect(await response.text()).toBe('product')
      expect(fetchProduct).toHaveBeenCalledWith(request)
      expect(fetchWebsiteAsset).not.toHaveBeenCalled()
    },
  )

  it.each(['/', '/docs', '/connection', '/conn-other', '/Conn'])(
    'keeps %s in the website Worker',
    async (pathname) => {
      const fetchProduct = vi.fn(async (_request: Request) => new Response('product'))
      const fetchWebsiteAsset = vi.fn(async (_request: Request) => new Response('website'))
      const request = new Request(`https://inspektor.dev${pathname}`)

      const response = await handleSiteRequest(request, { fetchProduct, fetchWebsiteAsset })

      expect(await response.text()).toBe('website')
      expect(fetchWebsiteAsset).toHaveBeenCalledWith(request)
      expect(fetchProduct).not.toHaveBeenCalled()
    },
  )

  it('serves the website shell with a 404 status for a missing navigation route', async () => {
    const fetchWebsiteAsset = vi.fn(async (request: Request) => {
      const pathname = new URL(request.url).pathname
      return pathname === '/index.html'
        ? new Response('website shell', { headers: { 'Content-Type': 'text/html' } })
        : new Response(null, { status: 404 })
    })

    const response = await handleSiteRequest(
      new Request('https://inspektor.dev/docs', { headers: { Accept: 'text/html' } }),
      {
        fetchProduct: vi.fn(async (_request: Request) => new Response('product')),
        fetchWebsiteAsset,
      },
    )

    expect(await response.text()).toBe('website shell')
    expect(response.status).toBe(404)
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(fetchWebsiteAsset).toHaveBeenCalledTimes(2)
    expect(new URL(fetchWebsiteAsset.mock.calls[1]?.[0].url ?? '').pathname).toBe('/index.html')
  })

  it('serves the website shell with a 200 status at the root', async () => {
    const fetchWebsiteAsset = vi.fn(async (request: Request) => {
      const pathname = new URL(request.url).pathname
      return pathname === '/index.html'
        ? new Response('website shell', { headers: { 'Content-Type': 'text/html' } })
        : new Response(null, { status: 404 })
    })

    const response = await handleSiteRequest(
      new Request('https://inspektor.dev/', { headers: { Accept: 'text/html' } }),
      {
        fetchProduct: vi.fn(async (_request: Request) => new Response('product')),
        fetchWebsiteAsset,
      },
    )

    expect(await response.text()).toBe('website shell')
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })

  it('keeps missing website subresources as errors', async () => {
    const fetchWebsiteAsset = vi.fn(async (_request: Request) =>
      Promise.resolve(new Response(null, { status: 404 })),
    )

    const response = await handleSiteRequest(
      new Request('https://inspektor.dev/assets/missing.js'),
      {
        fetchProduct: vi.fn(async (_request: Request) => new Response('product')),
        fetchWebsiteAsset,
      },
    )

    expect(response.status).toBe(404)
    expect(fetchWebsiteAsset).toHaveBeenCalledOnce()
  })

  it.each(['/assets', '/assets/missing.js', '/licenses', '/licenses/missing.txt'])(
    'does not return the website shell for the static path %s requested as HTML',
    async (pathname) => {
      const fetchWebsiteAsset = vi.fn(async (_request: Request) =>
        Promise.resolve(new Response(null, { status: 404 })),
      )

      const response = await handleSiteRequest(
        new Request(`https://inspektor.dev${pathname}`, {
          headers: { Accept: 'text/html' },
        }),
        {
          fetchProduct: vi.fn(async (_request: Request) => new Response('product')),
          fetchWebsiteAsset,
        },
      )

      expect(response.status).toBe(404)
      expect(fetchWebsiteAsset).toHaveBeenCalledOnce()
    },
  )

  it('adds website security and asset cache headers', async () => {
    const response = await handleSiteRequest(new Request('https://inspektor.dev/assets/app.js'), {
      fetchProduct: vi.fn(async (_request: Request) => new Response('product')),
      fetchWebsiteAsset: vi.fn(async (_request: Request) => new Response('asset')),
    })

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable, no-transform',
    )
    expect(response.headers.get('Content-Security-Policy')).toBe(
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'",
    )
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('does not rewrite the sitemap to the website shell', async () => {
    const fetchWebsiteAsset = vi.fn(async (request: Request) => {
      return new URL(request.url).pathname === '/sitemap.xml'
        ? new Response('<urlset />', { headers: { 'Content-Type': 'application/xml' } })
        : new Response(null, { status: 404 })
    })

    const response = await handleSiteRequest(new Request('https://inspektor.dev/sitemap.xml'), {
      fetchProduct: vi.fn(async (_request: Request) => new Response('product')),
      fetchWebsiteAsset,
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<urlset />')
    expect(fetchWebsiteAsset).toHaveBeenCalledOnce()
  })
})
