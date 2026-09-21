import { Box, GithubGlyph, Icon, Text } from '@inspektor/ds'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  BrandButtonLink,
  BrandNotFoundIllustration,
  BrandSiteFrame,
  BrandTextLink,
  BrandWordmark,
} from '@inspektor/ds/brand'

export function NotFoundPage(): React.ReactElement {
  const navigate = useNavigate()

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
      <Box
        as="section"
        width="full"
        height="full"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="2xl"
        paddingVertical="3xl"
        paddingHorizontal="xl"
      >
        <BrandNotFoundIllustration />
        <Text
          as="h1"
          variant="heading"
          align="center"
        >
          The page you're looking for does not exist.
        </Text>
        <Box
          gap="l"
          justifyContent="center"
        >
          <BrandButtonLink
            href="/"
            onClick={(event) => {
              if (
                event.metaKey === true ||
                event.ctrlKey === true ||
                event.shiftKey === true ||
                event.altKey === true
              ) {
                return
              }
              event.preventDefault()
              void navigate({ to: '/' })
            }}
          >
            Back home
          </BrandButtonLink>
        </Box>
      </Box>
    </BrandSiteFrame>
  )
}
