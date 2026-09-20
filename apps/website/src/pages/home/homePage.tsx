import { BrandSiteFrame, BrandWordmark } from '@inspektor/ds/brand'
import { Link } from '@tanstack/react-router'

import { HomeHero } from './homeHero'
import { HomeStudioPreview } from './homeStudioPreview'

export function HomePage(): React.ReactElement {
  return (
    <BrandSiteFrame
      header={
        <Link
          to="/"
          aria-label="Inspektor home"
        >
          <BrandWordmark />
        </Link>
      }
    >
      <HomeHero />
      <HomeStudioPreview />
    </BrandSiteFrame>
  )
}
