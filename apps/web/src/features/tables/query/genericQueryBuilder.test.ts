import { createDb, schema as s } from 'jazz-tools'
import { describe, expect, it } from 'vitest'

import { GenericQueryBuilder } from '@tables/query/genericQueryBuilder'

const app = s.defineApp({
  users: s.table({
    name: s.string(),
    payload: s.json(),
    rank: s.int(),
    signature: s.bytes(),
  }),
})

describe('GenericQueryBuilder Jazz contract', () => {
  it('executes filtering, sorting, limits, and offsets through installed Jazz', async () => {
    const db = await createDb({
      appId: 'generic-query-builder-contract',
      driver: { type: 'memory' },
    })

    try {
      await db.insert(app.users, {
        name: 'Ada',
        payload: { role: 'admin' },
        rank: 2,
        signature: new Uint8Array([1, 2]),
      })
      await db.insert(app.users, {
        name: 'Grace',
        payload: { role: 'admin' },
        rank: 4,
        signature: new Uint8Array([1, 2]),
      })
      await db.insert(app.users, {
        name: 'Linus',
        payload: { role: 'member' },
        rank: 1,
        signature: new Uint8Array([1, 2]),
      })
      await db.insert(app.users, {
        name: 'Margaret',
        payload: { role: 'admin' },
        rank: 3,
        signature: new Uint8Array([3, 4]),
      })

      const query = new GenericQueryBuilder('users', app.users._schema)
        .where({ rank: { lt: 4 } })
        .orderBy('rank', 'desc')
        .limit(1)
        .offset(1)
      const jsonQuery = new GenericQueryBuilder('users', app.users._schema)
        .where({ payload: { eq: { role: 'admin' } } })
        .orderBy('rank')
      const bytesQuery = new GenericQueryBuilder('users', app.users._schema)
        .where({ signature: { eq: new Uint8Array([1, 2]) } })
        .orderBy('rank')

      await expect(db.all(query)).resolves.toMatchObject([{ name: 'Ada', rank: 2 }])
      await expect(db.all(jsonQuery)).resolves.toMatchObject([
        { name: 'Ada' },
        { name: 'Margaret' },
        { name: 'Grace' },
      ])
      await expect(db.all(bytesQuery)).resolves.toMatchObject([
        { name: 'Linus' },
        { name: 'Ada' },
        { name: 'Grace' },
      ])
    } finally {
      await db.shutdown()
    }
  })
})
