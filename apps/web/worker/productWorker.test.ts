import { describe, expect, it, vi } from 'vitest'

import { handleProductRequest } from './productRequest'

describe('product Worker routing', () => {
  it.each([
    ['/conn', '/'],
    ['/conn/', '/'],
    ['/conn/assets/app.js', '/assets/app.js'],
    ['/conn/saved-connection/tables', '/saved-connection/tables'],
  ])('maps %s into the product asset namespace', async (pathname, assetPathname) => {
    const fetchAsset = vi.fn(async (_request: Request) => new Response('asset'))

    await handleProductRequest(new Request(`https://inspektor.dev${pathname}?view=data`), {
      fetchAsset,
    })

    expect(fetchAsset).toHaveBeenCalledOnce()
    expect(new URL(fetchAsset.mock.calls[0]?.[0].url ?? '')).toMatchObject({
      pathname: assetPathname,
      search: '?view=data',
    })
  })

  it.each(['/connection', '/conn-other', '/Conn'])(
    'rejects %s outside the product boundary',
    async (pathname) => {
      const fetchAsset = vi.fn(async (_request: Request) => new Response('asset'))
      const request = new Request(`https://inspektor.dev${pathname}`)

      const response = await handleProductRequest(request, { fetchAsset })

      expect(response.status).toBe(404)
      expect(fetchAsset).not.toHaveBeenCalled()
    },
  )

  it('serves the SPA shell for a missing navigation route', async () => {
    const fetchAsset = vi.fn(async (request: Request) => {
      const pathname = new URL(request.url).pathname
      return pathname === '/index.html'
        ? new Response('product shell', { headers: { 'Content-Type': 'text/html' } })
        : new Response(null, { status: 404 })
    })

    const response = await handleProductRequest(
      new Request('https://inspektor.dev/conn/saved-connection/tables', {
        headers: { Accept: 'text/html' },
      }),
      {
        fetchAsset,
      },
    )

    expect(await response.text()).toBe('product shell')
    expect(fetchAsset).toHaveBeenCalledTimes(2)
    expect(new URL(fetchAsset.mock.calls[1]?.[0].url ?? '').pathname).toBe('/index.html')
  })

  it('does not return the SPA shell for a missing product asset', async () => {
    const fetchAsset = vi.fn(async (_request: Request) => new Response(null, { status: 404 }))

    const response = await handleProductRequest(
      new Request('https://inspektor.dev/conn/assets/missing.js', {
        headers: { Accept: '*/*' },
      }),
      {
        fetchAsset,
      },
    )

    expect(response.status).toBe(404)
    expect(fetchAsset).toHaveBeenCalledOnce()
  })

  it('does not return the SPA shell for a missing product asset requested as HTML', async () => {
    const fetchAsset = vi.fn(async (request: Request) => {
      const pathname = new URL(request.url).pathname
      return pathname === '/index.html'
        ? new Response('product shell', { headers: { 'Content-Type': 'text/html' } })
        : new Response(null, { status: 404 })
    })

    const response = await handleProductRequest(
      new Request('https://inspektor.dev/conn/assets/missing.js', {
        headers: { Accept: 'text/html' },
      }),
      {
        fetchAsset,
      },
    )

    expect(response.status).toBe(404)
    expect(fetchAsset).toHaveBeenCalledOnce()
  })

  it.each(['/conn/assets', '/conn/brand'])(
    'does not return the SPA shell for the empty static namespace %s',
    async (pathname) => {
      const fetchAsset = vi.fn(async (_request: Request) => new Response(null, { status: 404 }))

      const response = await handleProductRequest(
        new Request(`https://inspektor.dev${pathname}`, {
          headers: { Accept: 'text/html' },
        }),
        { fetchAsset },
      )

      expect(response.status).toBe(404)
      expect(fetchAsset).toHaveBeenCalledOnce()
    },
  )

  it('adds product security and immutable asset headers', async () => {
    const response = await handleProductRequest(
      new Request('https://inspektor.dev/conn/assets/app.js'),
      {
        fetchAsset: vi.fn(async (_request: Request) => new Response('asset')),
      },
    )

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable, no-transform',
    )
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })
})
