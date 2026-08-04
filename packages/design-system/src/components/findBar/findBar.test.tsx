import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FindBar } from './findBar'

afterEach(cleanup)

const searchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regularExpression: false,
}

describe('FindBar', () => {
  it('uses searchbox semantics without the browser search-field clear control', () => {
    render(
      <FindBar
        label="Find in row JSON"
        value="account"
        onValueChange={() => undefined}
        state={{ status: 'matched', activeIndex: 0, count: 1 }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />,
    )

    expect(screen.getByRole('searchbox', { name: 'Find in row JSON' }).getAttribute('type')).toBe(
      'text',
    )
  })

  it('reserves the same status width for empty and matched results', () => {
    const { rerender } = render(
      <FindBar
        label="Find in row JSON"
        value="missing"
        onValueChange={() => undefined}
        state={{ status: 'empty' }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />,
    )
    const emptyStatusWidth = screen.getByRole('status').style.width

    expect(emptyStatusWidth).not.toBe('')

    rerender(
      <FindBar
        label="Find in row JSON"
        value="account"
        onValueChange={() => undefined}
        state={{ status: 'matched', activeIndex: 1, count: 6 }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />,
    )

    expect(screen.getByRole('status').style.width).toBe(emptyStatusWidth)
  })

  it('reports the active match and navigates with its actions', () => {
    const onPreviousMatch = vi.fn()
    const onNextMatch = vi.fn()

    render(
      <FindBar
        label="Find in row JSON"
        value="account"
        onValueChange={() => undefined}
        state={{ status: 'matched', activeIndex: 1, count: 6 }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={onPreviousMatch}
        onNextMatch={onNextMatch}
      />,
    )

    expect(screen.getByRole('searchbox', { name: 'Find in row JSON' })).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Match 2 of 6' }).textContent).toBe('2 of 6')

    fireEvent.click(screen.getByRole('button', { name: 'Previous match' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next match' }))

    expect(onPreviousMatch).toHaveBeenCalledOnce()
    expect(onNextMatch).toHaveBeenCalledOnce()
  })

  it('uses Enter and Shift+Enter to navigate while retaining input focus', () => {
    const onPreviousMatch = vi.fn()
    const onNextMatch = vi.fn()

    render(
      <FindBar
        label="Find in row JSON"
        value="account"
        onValueChange={() => undefined}
        state={{ status: 'matched', activeIndex: 0, count: 2 }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={onPreviousMatch}
        onNextMatch={onNextMatch}
      />,
    )
    const input = screen.getByRole('searchbox', { name: 'Find in row JSON' })
    input.focus()

    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(onNextMatch).toHaveBeenCalledOnce()
    expect(onPreviousMatch).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(input)
  })

  it('reports no matches and disables navigation', () => {
    const onValueChange = vi.fn()

    render(
      <FindBar
        label="Find in row JSON"
        value="missing"
        onValueChange={onValueChange}
        state={{ status: 'empty' }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />,
    )

    expect(screen.getByRole('status').textContent).toBe('No matches')
    expect(
      (screen.getByRole('button', { name: 'Previous match' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect((screen.getByRole('button', { name: 'Next match' }) as HTMLButtonElement).disabled).toBe(
      true,
    )

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'profile' } })
    expect(onValueChange).toHaveBeenCalledWith('profile')
  })

  it('controls match case, whole word, and regular expression options', () => {
    const onSearchOptionsChange = vi.fn()

    render(
      <FindBar
        label="Find in row JSON"
        value="User"
        onValueChange={() => undefined}
        state={{ status: 'matched', activeIndex: 0, count: 1 }}
        searchOptions={searchOptions}
        onSearchOptionsChange={onSearchOptionsChange}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />,
    )

    const matchCase = screen.getByRole('button', { name: 'Match case' })
    const wholeWord = screen.getByRole('button', { name: 'Match whole word' })
    const regularExpression = screen.getByRole('button', { name: 'Use regular expression' })

    expect(matchCase.getAttribute('aria-pressed')).toBe('false')
    expect(wholeWord.getAttribute('aria-pressed')).toBe('false')
    expect(regularExpression.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()

    fireEvent.click(matchCase)
    fireEvent.click(wholeWord)
    fireEvent.click(regularExpression)

    expect(onSearchOptionsChange).toHaveBeenNthCalledWith(1, {
      ...searchOptions,
      caseSensitive: true,
    })
    expect(onSearchOptionsChange).toHaveBeenNthCalledWith(2, {
      ...searchOptions,
      wholeWord: true,
    })
    expect(onSearchOptionsChange).toHaveBeenNthCalledWith(3, {
      ...searchOptions,
      regularExpression: true,
    })
  })
})
