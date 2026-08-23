interface PlaygroundSourceOptions {
  imports: Readonly<Record<string, boolean>>
  declarations?: string
  example: string
}

export const playgroundIconSource = {
  arrowLeft:
    '<svg aria-hidden="true" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>',
  arrowRight:
    '<svg aria-hidden="true" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>',
  plus: '<svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>',
} as const

export function createPlaygroundSource({
  imports,
  declarations,
  example,
}: PlaygroundSourceOptions): string {
  const importNames = Object.entries(imports)
    .filter(([, included]) => included === true)
    .map(([name]) => name)
  const sections = [`import { ${importNames.join(', ')} } from "@inspector/ds";`]

  if (declarations !== undefined) sections.push(declarations)
  sections.push(`export default function Example() {\n  return ${example};\n}`)

  return sections.join('\n\n')
}
