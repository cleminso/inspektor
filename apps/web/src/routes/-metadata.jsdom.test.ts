// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { describe, expect, it } from 'vitest'

import { Route as RootRoute } from './__root'
import { Route as ConnectionsRoute } from './conn'
import { Route as EditConnectionRoute } from './conn/edit/$connectionId'
import { Route as NewConnectionRoute } from './conn/new'
import { Route as QueriesRoute } from './conn/$connectionId/live-queries'
import { Route as TablesRoute } from './conn/$connectionId/tables'
import { Route as TableRoute } from './conn/$connectionId/tables/$tableName/index'

async function getTitle(
  route: { options: { head?: (context: never) => unknown } },
  params: Record<string, string> = {},
): Promise<string | undefined> {
  const result = (await route.options.head?.({ params } as never)) as
    | { meta?: Array<{ title?: string }> }
    | undefined
  return result?.meta?.find((meta) => meta.title !== undefined)?.title
}

describe('route metadata', () => {
  it.each([
    [RootRoute, {}, 'Inspektor'],
    [ConnectionsRoute, {}, 'Connections | Inspektor'],
    [EditConnectionRoute, { connectionId: 'connection-1' }, 'Edit connection | Inspektor'],
    [NewConnectionRoute, {}, 'Add connection | Inspektor'],
    [TablesRoute, {}, 'Tables | Inspektor'],
    [QueriesRoute, {}, 'Live queries | Inspektor'],
    [TableRoute, { connectionId: 'connection-1', tableName: 'accounts' }, 'accounts | Inspektor'],
  ])('sets the routed document title', async (route, params, title) => {
    expect(await getTitle(route, params)).toBe(title)
  })
})
