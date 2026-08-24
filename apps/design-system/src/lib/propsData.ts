import generatedProps from '@/generated/props.json'

export interface GeneratedPropItem {
  name: string
  type: string
  required: boolean
  defaultValue?: string
  description: string
  deprecated?: string
  source: {
    path: string
    line: number
  }
}

type GeneratedPropsByComponentId = Record<string, GeneratedPropItem[]>

const propsByComponentId = generatedProps as GeneratedPropsByComponentId

export function getGeneratedProps(
  componentId: string,
  propNames: readonly string[],
): GeneratedPropItem[] {
  const componentProps = propsByComponentId[componentId]
  if (componentProps === undefined) {
    throw new Error(`Generated props are missing for component ${componentId}.`)
  }

  return propNames.map((propName) => {
    const prop = componentProps.find(({ name }) => name === propName)
    if (prop === undefined) {
      throw new Error(`Generated prop ${componentId}.${propName} is missing.`)
    }

    return prop
  })
}
