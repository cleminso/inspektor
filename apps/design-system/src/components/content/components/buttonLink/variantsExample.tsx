import { Box, ButtonLink, type ButtonVariant } from "@inspector/ds";
import { type ReactElement } from "react";

const variants: ButtonVariant[] = [
  "primary",
  "secondary",
  "danger",
  "ghost",
  "outline",
  "link",
];

export default function VariantsExample(): ReactElement {
  return (
    <Box alignItems="center" flexWrap="wrap" gap="m">
      {variants.map((variant) => (
        <ButtonLink key={variant} href={`#${variant}`} variant={variant}>
          {variant}
        </ButtonLink>
      ))}
    </Box>
  );
}
