import { Box } from '@inspektor/ds'
import { BrandButtonLink, BrandHero, BrandTextLink } from '@inspektor/ds/brand'

export function HomeHero(): React.ReactElement {
  return (
    <BrandHero
      title="inspektor studio"
      continuation={'explore your Jazz application\u00a0data'}
      description="Connect to your Jazz sync server from your browser to inspect schemas and records, filter data, edit supported rows, and monitor live queries."
      action={
        <Box
          alignItems="center"
          gap="l"
        >
          <BrandButtonLink href="/conn">Open Inspektor</BrandButtonLink>
          <BrandTextLink
            href="https://github.com/cleminso/inspektor"
            target="_blank"
            rel="noopener noreferrer"
          >
            open source
          </BrandTextLink>
        </Box>
      }
    />
  )
}
