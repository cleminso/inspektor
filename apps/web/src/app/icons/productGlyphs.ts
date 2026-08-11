import type { IconArtwork } from "@inspector/ds";
import { ArrowUpRight, EllipsisVertical, Layers, Layers3, Table2 } from "lucide-react";

export const productGlyphs = {
  derivedView: Layers3,
  ellipsis: EllipsisVertical,
  relation: ArrowUpRight,
  schema: Layers,
  table: Table2,
} satisfies Record<string, IconArtwork>;
