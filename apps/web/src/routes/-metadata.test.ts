// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { describe, expect, it } from 'vitest'

import { Route as RootRoute } from './__root'
import { Route as ConnectionsRoute } from './conn'
import { Route as NewConnectionRoute } from './conn/new'
import { Route as TablesRoute } from './conn/$connectionId/tables'
import { Route as TableRoute } from './conn/$connectionId/tables/$tableName/index'
import { Route as QueriesRoute } from './conn/$connectionId/queries'

async function getTitle(
  route: { options: { head?: (context: never) => unknown } },
  params: Record<string, string> = {},
): Promise<string | undefined> {
  const head = route.options.head
  if (head === undefined) {
    return undefined
  }

  const result = (await head({ params } as never)) as {
    meta?: Array<{ title?: string }>
  }
  return result.meta?.find((meta) => meta.title !== undefined)?.title
}

describe('route metadata', () => {
  it('provides a default application title', async () => {
    expect(await getTitle(RootRoute)).toBe('Inspector')
  })

  it.each([
    [ConnectionsRoute, 'Connections | Inspector'],
    [NewConnectionRoute, 'Add connection | Inspector'],
    [TablesRoute, 'Tables | Inspector'],
    [QueriesRoute, 'Query subscriptions | Inspector'],
  ])('provides a routed screen title', async (route, title) => {
    expect(await getTitle(route)).toBe(title)
  })

  it('includes the selected table in the routed screen title', async () => {
    expect(
      await getTitle(TableRoute, { connectionId: 'connection-1', tableName: 'accounts' }),
    ).toBe('accounts | Inspector')
  })
})
