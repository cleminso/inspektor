import generatedProps from "@/generated/props.json";

export interface GeneratedPropItem {
  name: string;
  type: string;
  required: boolean;
  sourcePath: string;
}

export type GeneratedPropsBySlug = Record<string, GeneratedPropItem[]>;

export const propsBySlug = generatedProps as GeneratedPropsBySlug;

export function getGeneratedProps(slug: string): GeneratedPropItem[] {
  return propsBySlug[slug] ?? [];
}
