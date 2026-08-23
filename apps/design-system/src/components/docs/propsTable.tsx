import { Box } from '@inspector/ds'
import * as stylex from '@stylexjs/stylex'
import { type ReactElement } from 'react'

import { type GeneratedPropItem } from '@/lib/propsData'

export function PropsTable({ rows }: { rows: readonly GeneratedPropItem[] }): ReactElement {
  return (
    <Box
      display="block"
      overflowX="auto"
    >
      <table {...stylex.props(styles.table)}>
        <thead>
          <tr>
            <th {...stylex.props(styles.heading)}>Prop</th>
            <th {...stylex.props(styles.heading)}>Type</th>
            <th {...stylex.props(styles.heading)}>Default</th>
            <th {...stylex.props(styles.heading)}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.name}
              {...stylex.props(styles.row)}
            >
              <td {...stylex.props(styles.cell, styles.nameCell)}>
                <code>{row.name}</code>
                {row.required === true ? (
                  <span {...stylex.props(styles.required)}>required</span>
                ) : null}
              </td>
              <td {...stylex.props(styles.cell)}>
                <code {...stylex.props(styles.type)}>{row.type}</code>
              </td>
              <td {...stylex.props(styles.cell)}>
                {row.defaultValue !== undefined ? <code>{row.defaultValue}</code> : '—'}
              </td>
              <td {...stylex.props(styles.cell, styles.description)}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}

const styles = stylex.create({
  table: {
    width: '100%',
    minWidth: 720,
    borderCollapse: 'collapse',
    fontSize: 13,
    lineHeight: '20px',
  },
  heading: {
    padding: '10px 12px',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'light-dark(oklch(0.852 0.006 43.325), oklch(0.391 0.0077 317.73))',
    textAlign: 'left',
    fontWeight: 500,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'light-dark(oklch(0.925 0.004 34.309), oklch(0.391 0.0077 317.73))',
  },
  cell: {
    padding: 12,
    verticalAlign: 'top',
  },
  nameCell: {
    whiteSpace: 'nowrap',
  },
  required: {
    display: 'block',
    fontSize: 11,
    color: 'light-dark(oklch(0.627 0.192 6.574), oklch(0.706 0.194 8.454))',
  },
  type: {
    color: 'light-dark(oklch(0.535 0.154 291.137), oklch(0.741 0.121 290.676))',
  },
  description: {
    minWidth: 240,
    color: 'light-dark(oklch(0.645 0.007 350.912), oklch(0.661 0.002 325.597))',
  },
})
