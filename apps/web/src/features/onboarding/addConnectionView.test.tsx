import { render, screen } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { PrefillConfig } from '@app/connections/prefill'

import { AddConnectionView } from './addConnectionView'

const session = vi.hoisted(() => ({
  prefill: null as PrefillConfig | null,
}))
const flow = vi.hoisted(() => ({ nextId: 0 }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => session,
}))

vi.mock('./useAddConnectionFlow', () => ({
  useAddConnectionFlow: () => {
    const [id] = useState(() => ++flow.nextId)
    return {
      error: null,
      fetchSchemas: vi.fn(),
      formValues: {
        name: `Flow ${id}`,
        serverUrl: '',
        appId: '',
        adminSecret: '',
        env: 'dev',
        branch: 'main',
      },
      goBackToForm: vi.fn(),
      isSubmitting: false,
      schemaHashes: [],
      selectSchema: vi.fn(),
      step: 'form',
      updateField: vi.fn(),
    }
  },
}))

vi.mock('./addConnectionForm', () => ({
  AddConnectionForm: ({ formValues }: { formValues: { name: string } }) => (
    <div>{formValues.name}</div>
  ),
}))

vi.mock('./schemaSwitcher', () => ({
  SchemaSwitcher: () => null,
}))

describe('AddConnectionView', () => {
  it('resets the flow when prefilled credentials change', () => {
    session.prefill = {
      name: 'Production',
      serverUrl: 'https://sync.example.com',
      appId: 'production-app',
      adminSecret: 'production-secret',
      env: 'production',
      branch: 'main',
    }
    const view = render(<AddConnectionView />)
    expect(screen.getByText('Flow 1')).toBeTruthy()

    session.prefill = {
      ...session.prefill,
      adminSecret: 'rotated-secret',
    }
    view.rerender(<AddConnectionView />)

    expect(screen.getByText('Flow 2')).toBeTruthy()
  })
})
