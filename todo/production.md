# Production deployment checklist

## Table of contents

- [Purpose](#purpose)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled deployment decisions](#settled-deployment-decisions)
- [Open deployment decisions](#open-deployment-decisions)
- [Validation checklist](#validation-checklist)

## Purpose

This checklist records production asset-delivery requirements that cannot be validated through the Vite development server or preview server alone.

## Implemented foundation

[04/09/26]

- [x] Verify production serves compressible assets with Brotli and applies immutable caching to content-hashed assets.

[04/09/26]

- [x] Document the Cloudflare deployment, domain, TLS, DNSSEC, security-header, cache, privacy, and production-verification workflow.
- [x] Configure immutable browser caching for content-hashed production assets while retaining revalidation for HTML.
- [x] Select Cloudflare Workers Static Assets as the production host.

[27/08/26]

- [x] Build content-hashed JavaScript, CSS, font, worker, and WASM assets through Vite.

## Open product work

[07/09/26]

- [ ] Define privacy-safe production error and availability observability without collecting connection credentials, inspected data, or Jazz server responses.

## Work outside the foundation scope

[27/08/26]

- CDN and hosting-provider selection remain deployment concerns rather than application runtime concerns.

## Settled deployment decisions

[27/08/26]

- Production performance decisions use built application traces rather than Vite development traces.
- Hashed assets may use immutable caching because a content change creates a different URL.
- The HTML entry point must remain revalidated so deployments can reference new asset hashes.
- Production loads the version-matched Jazz WASM binary from a content-addressed R2 object on `assets.inspektor.dev`; Workers Static Assets excludes only its oversized bundled fallback.

## Open deployment decisions

No open deployment decisions.

## Validation checklist

[27/08/26]

- [x] Confirm the deployed Jazz WASM response uses Brotli or gzip content encoding.
- [x] Confirm hashed assets return a long-lived immutable `Cache-Control` policy and the HTML entry point does not.
- [ ] Capture cold and warm built-application traces against the deployed host and verify warm font, JavaScript, CSS, worker, and WASM transfers come from cache.
