import { describe, expect, it } from 'vitest'

import { createInitialFormValues, getPrefillKey } from './connectionFormTypes'

const prefill = {
  name: 'Production',
  serverUrl: 'https://sync.example.com',
  appId: 'production-app',
  adminSecret: 'production-secret',
  env: 'production',
  branch: 'release',
}

describe('connectionFormTypes', () => {
  it('preserves prefilled connection credentials in the initial values', () => {
    expect(createInitialFormValues(prefill)).toEqual(prefill)
  })

  it.each(['serverUrl', 'appId', 'adminSecret'] as const)(
    'includes %s in the prefill key',
    (field) => {
      expect(getPrefillKey({ ...prefill, [field]: `${prefill[field]}-changed` })).not.toBe(
        getPrefillKey(prefill),
      )
    },
  )
})
