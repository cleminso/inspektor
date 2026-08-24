import { createContext, useContext } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SchemaSwitcher } from '@app/shell/header/schemaSwitcher'

const schemaHashes = ['schema-2', 'schema-1']
const ContextSwitcherItems = createContext<readonly string[]>([])

vi.mock('@inspector/ds', () => {
  const Part = ({ children, translate }: { children?: React.ReactNode; translate?: 'no' }) => (
    <div translate={translate}>{children}</div>
  )
  const Root = ({ children, items }: { children?: React.ReactNode; items?: readonly string[] }) => (
    <ContextSwitcherItems.Provider value={items ?? []}>{children}</ContextSwitcherItems.Provider>
  )
  const List = ({
    children,
  }: {
    children?: React.ReactNode | ((value: string) => React.ReactNode)
  }) => {
    const items = useContext(ContextSwitcherItems)
    return (
      <div>{typeof children === 'function' ? items.map((value) => children(value)) : children}</div>
    )
  }
  return {
    ContextSwitcher: {
      Root,
      Trigger: Part,
      Content: Part,
      Search: Part,
      Viewport: Part,
      Empty: Part,
      List,
      Item: Part,
    },
    Text: Part,
  }
})

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentSchemaHash: 'schema-1',
    switchSchema: vi.fn(),
  }),
  useRuntimeSchemaHashes: () => schemaHashes,
}))

afterEach(cleanup)

describe('SchemaSwitcher', () => {
  it('renders the route-owned schema order', () => {
    render(<SchemaSwitcher />)

    expect(screen.getAllByText(/^schema-/).map((element) => element.textContent)).toEqual([
      'schema-1',
      'schema-2',
      'schema-1',
    ])
  })

  it('excludes the displayed schema hash from translation', () => {
    render(<SchemaSwitcher />)

    for (const schemaHash of screen.getAllByText('schema-1')) {
      expect(schemaHash.closest('[translate="no"]')).toBeTruthy()
    }
  })
})
