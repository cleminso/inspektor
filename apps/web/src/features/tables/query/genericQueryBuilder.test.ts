import { schema as s } from 'jazz-tools'
import { createJazzSession } from 'jazz-tools/backend'
import { deploy, startLocalJazzServer } from 'jazz-tools/testing'
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
    const server = await startLocalJazzServer({ inMemory: true })
    await deploy({
      adminSecret: server.adminSecret,
      appId: server.appId,
      schema: app,
      serverUrl: server.url,
    })
    const session = await createJazzSession({
      app,
      appId: server.appId,
      driver: { type: 'memory' },
      initial: { backendSecret: server.backendSecret },
      serverUrl: server.url,
    })

    try {
      const snapshot = session.getSnapshot()
      if (snapshot.status !== 'ready' || snapshot.client === undefined) {
        throw new Error('Generic query contract session is not ready.')
      }
      const db = snapshot.client.db
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
      const provenanceQuery = new GenericQueryBuilder('users', app.users._schema)
        .select('*', '$createdAt', '$createdBy', '$updatedAt', '$updatedBy')
        .orderBy('$createdAt')

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
      const provenanceRows = await db.all(provenanceQuery)
      expect(provenanceRows).toHaveLength(4)
      const createdAtValues = provenanceRows.map((row) => row.$createdAt)
      const createdByValues = provenanceRows.map((row) => row.$createdBy)
      const updatedAtValues = provenanceRows.map((row) => row.$updatedAt)
      const updatedByValues = provenanceRows.map((row) => row.$updatedBy)
      expect(createdAtValues.every((value) => value instanceof Date)).toBe(true)
      expect(createdByValues.every((value) => value !== null && typeof value === 'object')).toBe(
        true,
      )
      expect(updatedAtValues.every((value) => value instanceof Date)).toBe(true)
      expect(updatedByValues.every((value) => value !== null && typeof value === 'object')).toBe(
        true,
      )
      for (const author of [...createdByValues, ...updatedByValues]) {
        expect(author).toMatchObject({
          account: expect.any(String),
          identity: {
            issuer: expect.any(String),
            subject: expect.any(String),
          },
        })
      }
      const createdAtTimestamps = createdAtValues.map((value) => {
        if (value instanceof Date === false) {
          throw new Error('Jazz returned a non-Date $createdAt value.')
        }
        return value.getTime()
      })
      expect(createdAtTimestamps).toEqual(
        [...createdAtTimestamps].sort((left, right) => left - right),
      )
    } finally {
      await session.close()
      await server.stop()
    }
  })
})
