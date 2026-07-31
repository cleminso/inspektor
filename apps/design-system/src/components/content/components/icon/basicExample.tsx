import { Box, Icon } from "@inspector/ds";
import { Activity, Table } from "lucide-react";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Box alignItems="center" gap="l">
      <Icon render={<Table />} size="xs" />
      <Icon render={<Activity />} size="s" />
      <Icon render={<Table />} size="m" />
    </Box>
  );
}
