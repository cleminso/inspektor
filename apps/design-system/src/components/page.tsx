import { ButtonLink } from '@inspektor/ds'
import { Link as RouterLink } from '@tanstack/react-router'

import { type ReactElement } from 'react'

import { DocsPage } from '@/components/docs/docsPage'
import { PageHeader } from '@/components/docs/pageHeader'
import { AppShellDetails } from '@/layout/appShellDetails'

const homeDescription = 'Foundations and components used to build consistent Inspektor interfaces.'

export function HomePage(): ReactElement {
  return (
    <>
      <DocsPage>
        <PageHeader
          title="Inspektor Design System"
          description={homeDescription}
        />
      </DocsPage>
      <AppShellDetails
        label="Design system details"
        description={homeDescription}
      />
    </>
  )
}

export function NotFoundPage(): ReactElement {
  return (
    <>
      <DocsPage>
        <PageHeader
          title="Page not found"
          description="This design-system page does not exist or is not documented."
        />
        <ButtonLink
          variant="secondary"
          render={<RouterLink to="/" />}
        >
          Return to the catalog
        </ButtonLink>
      </DocsPage>
      <AppShellDetails
        label="Page details"
        description="The requested design-system page is not documented."
      />
    </>
  )
}
