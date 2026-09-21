import { Box, GithubGlyph, Icon } from '@inspektor/ds'
import { BrandSiteFrame, BrandTextLink, BrandWordmark } from '@inspektor/ds/brand'
import { Link } from '@tanstack/react-router'

import { HomeHero } from './homeHero'
import { HomeStudioPreview } from './homeStudioPreview'

export function HomePage(): React.ReactElement {
  return (
    <BrandSiteFrame
      header={
        <Box
          alignItems="center"
          justifyContent="between"
          width="full"
        >
          <Link
            to="/"
            aria-label="Inspektor home"
          >
            <BrandWordmark />
          </Link>
          <BrandTextLink
            href="https://github.com/cleminso/inspektor"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Inspektor on GitHub"
            iconOnly
          >
            <Icon artwork={GithubGlyph} />
          </BrandTextLink>
        </Box>
      }
    >
      <HomeHero />
      <HomeStudioPreview />
    </BrandSiteFrame>
  )
}
