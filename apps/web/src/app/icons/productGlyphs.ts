import type { IconArtwork } from "@inspector/ds";
import { ArrowUpRight, Layers, Layers3, Table2 } from "lucide-react";

export const productGlyphs = {
  derivedView: Layers3,
  relation: ArrowUpRight,
  schema: Layers,
  table: Table2,
} satisfies Record<string, IconArtwork>;
