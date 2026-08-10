import { createElement, type ComponentType, type ReactElement } from 'react'

interface ComponentModule<Props extends object> {
  default: ComponentType<Props>
}

export function createPreloadableComponent<Props extends object>(
  loadModule: () => Promise<ComponentModule<Props>>,
) {
  let loadedModule: ComponentModule<Props> | null = null
  let loadPromise: Promise<ComponentModule<Props>> | null = null
  let renderFailure: { value: unknown } | null = null
  let requestedByRender = false

  const preload = () => {
    if (loadPromise !== null) {
      return loadPromise
    }

    const request = loadModule().then(
      (module) => {
        loadedModule = module
        return module
      },
      (error: unknown) => {
        if (requestedByRender === true) {
          renderFailure = { value: error }
        } else {
          loadPromise = null
        }
        throw error
      },
    )
    loadPromise = request
    return request
  }

  const Component = (props: Props): ReactElement => {
    if (loadedModule !== null) {
      return createElement(loadedModule.default, props)
    }
    if (renderFailure !== null) {
      throw renderFailure.value
    }

    requestedByRender = true
    throw preload()
  }

  return { Component, preload }
}
