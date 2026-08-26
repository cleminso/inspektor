import { createElement, lazy, type ComponentType, type ReactElement } from 'react'

interface ComponentModule<Props extends object> {
  default: ComponentType<Props>
}

export function createPreloadableComponent<Props extends object>(
  loadModule: () => Promise<ComponentModule<Props>>,
) {
  let loadedModule: ComponentModule<Props> | null = null
  let loadPromise: Promise<ComponentModule<Props>> | null = null

  const preload = () => {
    if (loadPromise !== null) {
      return loadPromise
    }

    loadPromise = loadModule().then(
      (module): ComponentModule<Props> => {
        loadedModule = module
        return module
      },
      (error: unknown) => {
        loadPromise = null
        throw error
      },
    )
    return loadPromise
  }
  const LazyComponent = lazy(preload)

  const Component = (props: Props): ReactElement => {
    if (loadedModule !== null) {
      return createElement(loadedModule.default, props)
    }
    return createElement(LazyComponent, props)
  }

  return { Component, preload }
}
