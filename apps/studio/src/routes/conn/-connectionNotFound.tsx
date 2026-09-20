import { Box, ButtonLink, ShellLayout, Text } from '@inspektor/ds'
import { Link } from '@tanstack/react-router'

import { BrandNotFoundIllustration } from '@inspektor/ds/brand'

import { appRoutes } from '@app/routing/appRoutes'

interface ConnectionNotFoundProps {
  connectionId: string
}

export function ConnectionNotFound({ connectionId }: ConnectionNotFoundProps): React.ReactElement {
  return (
    <ShellLayout.Body>
      <ShellLayout.View>
        <Box
          width="full"
          height="full"
          backgroundColor="surface-background"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="2xl"
          padding="2xl"
        >
          <BrandNotFoundIllustration />
          <Text
            as="h2"
            variant="heading"
            align="center"
          >
            The page you're looking for does not exist.
          </Text>
          <ButtonLink
            size="m"
            variant="primary"
            render={
              <Link
                to={appRoutes.tables}
                params={{ connectionId }}
              />
            }
          >
            Back to connection
          </ButtonLink>
        </Box>
      </ShellLayout.View>
    </ShellLayout.Body>
  )
}
