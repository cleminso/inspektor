import { Button } from "@inspector/ds";
import { Link } from "@tanstack/react-router";

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
      <Button variant="outline" render={<Link to="/" />}>
        Return to the catalog
      </Button>
    </DocsPage>
  );
}
