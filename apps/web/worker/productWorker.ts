import { handleProductRequest } from './productRequest'

export default {
  async fetch(request, env): Promise<Response> {
    return handleProductRequest(request, {
      fetchAsset: (assetRequest) => env.ASSETS.fetch(assetRequest),
    })
  },
} satisfies ExportedHandler<Env>
