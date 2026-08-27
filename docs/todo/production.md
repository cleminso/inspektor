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

[27/08/26]

- [x] Build content-hashed JavaScript, CSS, font, worker, and WASM assets through Vite.

## Open product work

[27/08/26]

- [ ] Add a production deployment guide covering compressed static assets, cache policy, and deployed-header verification.
- [ ] Configure Brotli or gzip delivery for compressible built assets, including the Jazz WASM binary.
- [ ] Configure long-lived immutable caching for content-hashed assets while keeping the HTML entry point revalidated.

## Work outside the foundation scope

[27/08/26]

- CDN and hosting-provider selection remain deployment concerns rather than application runtime concerns.

## Settled deployment decisions

[27/08/26]

- Production performance decisions use built application traces rather than Vite development traces.
- Hashed assets may use immutable caching because a content change creates a different URL.
- The HTML entry point must remain revalidated so deployments can reference new asset hashes.

## Open deployment decisions

[27/08/26]

- [ ] Select the production host configuration that owns compression and cache headers.

## Validation checklist

[27/08/26]

- [ ] Confirm the deployed Jazz WASM response uses Brotli or gzip content encoding.
- [ ] Confirm hashed assets return a long-lived immutable `Cache-Control` policy and the HTML entry point does not.
- [ ] Capture cold and warm built-application traces against the deployed host and verify warm font, JavaScript, CSS, worker, and WASM transfers come from cache.
