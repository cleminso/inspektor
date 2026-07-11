import { Button } from "@inspector/ds";
import { Code2 } from "lucide-react";
import { type ReactElement } from "react";

import { type SourceReference } from "@/lib/registry";

const repositoryUrl = "https://github.com/regardedev/inspector/blob/main";

export function SourceLink({ source }: { source: SourceReference }): ReactElement {
  return (
    <Button
      variant="outline"
      size="s"
      render={
        <a
          href={`${repositoryUrl}/${source.path}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${source.label} on GitHub`}
        />
      }
    >
      <Code2 aria-hidden="true" size={14} strokeWidth={1.75} />
      Source
    </Button>
  );
}
