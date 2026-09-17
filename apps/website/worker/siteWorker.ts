import { handleSiteRequest } from './siteRequest'

export default {
  async fetch(request, env): Promise<Response> {
    return handleSiteRequest(request, {
      fetchProduct: (productRequest) => env.PRODUCT.fetch(productRequest),
      fetchWebsiteAsset: (assetRequest) => env.ASSETS.fetch(assetRequest),
    })
  },
} satisfies ExportedHandler<Env>
