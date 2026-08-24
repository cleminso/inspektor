import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { appRoutes } from '@app/routing/appRoutes'

import { Route } from './index'

describe('root index route', () => {
  it('redirects to connections', () => {
    try {
      Route.options.beforeLoad?.({} as never)
    } catch (error) {
      expect(isRedirect(error)).toBe(true)
      expect(error).toMatchObject({ options: { to: appRoutes.connections } })
      return
    }

    throw new Error('Expected the root index route to redirect')
  })
})
