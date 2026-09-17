import { BrandSiteFrame, BrandWordmark } from '@inspektor/ds/brand'

import { HomeHero } from './homeHero'

export function HomePage(): React.ReactElement {
  return (
    <BrandSiteFrame header={<BrandWordmark />}>
      <HomeHero />
    </BrandSiteFrame>
  )
}
