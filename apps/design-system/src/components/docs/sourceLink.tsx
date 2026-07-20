import { ButtonLink, Text, TextLink } from "@inspector/ds";
import { type ReactElement } from "react";

import { type SourceReference } from "@/lib/registry";

const repositoryUrl = "https://github.com/regardedev/inspector/blob/main";

interface SourceLinkProps {
  source: SourceReference;
  title?: string;
}

function OpenNewWindowIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 3H15M21 3L12 12M21 3V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SourceLink({ source, title }: SourceLinkProps): ReactElement {
  const href = `${repositoryUrl}/${source.path}`;

  if (title !== undefined) {
    return (
      <Text as="h1" variant="title" aria-label={title}>
        <TextLink
          variant="headingdefault"
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${title} source on GitHub`}
          trailingIcon={<OpenNewWindowIcon />}
        >
          {title}
        </TextLink>
      </Text>
    );
  }

  return (
    <ButtonLink
      variant="link"
      size="s"
      shape="square"
      radius="m"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${source.label} on GitHub`}
    >
      <OpenNewWindowIcon />
    </ButtonLink>
  );
}
