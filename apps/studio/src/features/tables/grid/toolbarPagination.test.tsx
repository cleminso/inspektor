import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TablePagination } from './toolbar'

afterEach(cleanup)

describe('TablePagination', () => {
  it('reports page navigation and disables unavailable directions', () => {
    const onPageChange = vi.fn()

    render(
      <TablePagination
        hasNextPage
        hasPreviousPage={false}
        loadedRowCount={100}
        page={1}
        pageSize={100}
        onPageChange={onPageChange}
        onPageSizeChange={() => undefined}
      />,
    )

    expect(screen.getByText('Page 1').getAttribute('data-numeric-variant')).toBe('tabular')
    expect(screen.getByText('1–100 of 101+')).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: 'Page' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled')).toBe(
      true,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('reports a supported page-size selection', () => {
    const onPageSizeChange = vi.fn()
    render(
      <TablePagination
        hasNextPage={false}
        hasPreviousPage
        loadedRowCount={100}
        page={2}
        pageSize={100}
        onPageChange={() => undefined}
        onPageSizeChange={onPageSizeChange}
      />,
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Rows per page' }))
    const option = screen.getByRole('option', { name: '500' })
    fireEvent.pointerDown(option, { pointerType: 'mouse' })
    fireEvent.click(option)

    expect(onPageSizeChange).toHaveBeenCalledWith(500)
  })

  it('reports an exact total when the current page is the last page', () => {
    render(
      <TablePagination
        hasNextPage={false}
        hasPreviousPage
        loadedRowCount={4}
        page={101}
        pageSize={100}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    )

    expect(screen.getByText('10,001–10,004 of 10,004')).toBeTruthy()
  })

  it('reports an empty result without changing the range layout', () => {
    render(
      <TablePagination
        hasNextPage={false}
        hasPreviousPage={false}
        loadedRowCount={0}
        page={1}
        pageSize={100}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    )

    expect(screen.getByText('0–0 of 0')).toBeTruthy()
  })

  it('does not report an empty range before the first result settles', () => {
    render(
      <TablePagination
        hasNextPage={false}
        hasPreviousPage={false}
        loadedRowCount={0}
        loading
        page={1}
        pageSize={100}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    )

    expect(screen.queryByText('0–0 of 0')).toBeNull()
  })

  it('keeps the settled range and page visible while a new page size loads', () => {
    const { container, rerender } = render(
      <TablePagination
        hasNextPage
        hasPreviousPage={false}
        loadedRowCount={100}
        page={1}
        pageSize={100}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    )

    rerender(
      <TablePagination
        hasNextPage={false}
        hasPreviousPage={false}
        loadedRowCount={0}
        loading
        page={1}
        pageSize={500}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    )

    expect(screen.getByText('1–100 of 101+')).toBeTruthy()
    expect(screen.getByText('Page 1')).toBeTruthy()
    const pageSize = screen.getByRole('combobox', { name: 'Rows per page' })
    expect(pageSize.textContent).toContain('500')
    expect(pageSize.hasAttribute('disabled')).toBe(true)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })
})
