import { ButtonLink } from "@inspector/ds";
import { Link as RouterLink } from "@tanstack/react-router";

import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { PageHeader } from "@/components/docs/pageHeader";


export function HomePage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title="Inspector Design System"
        description="Foundations and components used to build consistent inspector interfaces."
      />
    </DocsPage>
  );
}

export function NotFoundPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title="Page not found"
        description="This design-system page does not exist or is not documented."
      />
      <ButtonLink variant="secondary" render={<RouterLink to="/" />}>
        Return to the catalog
      </ButtonLink>
    </DocsPage>
  );
}
