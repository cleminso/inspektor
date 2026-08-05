import { describe, expect, it } from 'vitest'

import { breakpointQueries, breakpointValues } from './breakpoints.stylex'
import {
  backgroundColors,
  borderRadii,
  borderColors,
  layerIndexes,
  spatial,
  textColors,
  textRoleStyles,
} from './tokens.stylex'
import {
  borderRadiusValues,
  dimensionValues,
  fontSizeValues,
  lineHeightValues,
  spacingValues,
} from './value.stylex'

const nonzeroValues = (values: Readonly<Record<string, string>>) =>
  Object.values(values).filter((value) => value !== '0')

describe('semantic token contract', () => {
  it('defines neutral toast border roles without notification surfaces', () => {
    expect(backgroundColors).not.toHaveProperty('bg-notification-warning')
    expect(backgroundColors).not.toHaveProperty('bg-notification-error')
    expect(backgroundColors).not.toHaveProperty('bg-notification-info')
    expect(backgroundColors).not.toHaveProperty('bg-notification-loading')
    expect(Object.keys(textColors).some((token) => token.startsWith('fg-'))).toBe(false)
    expect(borderColors).toMatchObject({
      'border-warning': expect.any(String),
      'border-danger': expect.any(String),
      'border-success': expect.any(String),
    })
  })

  it('exposes only the Inspector text scale and roles', () => {
    expect(fontSizeValues).toEqual({
      1: '0.75rem',
      2: '0.8125rem',
      3: '1rem',
      4: '1.25rem',
    })
    expect(textRoleStyles).toMatchObject({
      default: expect.any(Object),
      title: expect.any(Object),
      body: expect.any(Object),
      label: expect.any(Object),
      caption: expect.any(Object),
      heading: expect.any(Object),
    })
    expect(textRoleStyles).not.toHaveProperty('heading-l')
    expect(textRoleStyles).not.toHaveProperty('heading-m')
    expect(textRoleStyles).not.toHaveProperty('heading-s')
    expect(textRoleStyles).not.toHaveProperty('heading-xs')
  })

  it('defines layer and spatial roles', () => {
    expect(layerIndexes).toMatchObject({
      content: expect.any(Number),
      navigation: expect.any(Number),
      popup: expect.any(Number),
      tooltip: expect.any(Number),
      overlay: expect.any(Number),
      modal: expect.any(Number),
      toast: expect.any(Number),
      drag: expect.any(Number),
    })
    expect(spatial).toMatchObject({
      'button-height-xs': expect.any(String),
      'button-height-s': expect.any(String),
      'button-height-m': expect.any(String),
      'tab-height': expect.any(String),
      'control-height-s': expect.any(String),
      'control-height-m': expect.any(String),
      'control-height-l': expect.any(String),
      'icon-size-xs': expect.any(String),
      'icon-size-s': expect.any(String),
      'icon-size-m': expect.any(String),
      'focus-ring-width': expect.any(String),
      'popup-width-s': expect.any(String),
      'popup-width-m': expect.any(String),
      'popup-width-l': expect.any(String),
      'label-width': expect.any(String),
      'tooltip-width': expect.any(String),
      'content-measure': expect.any(String),
      'content-width': expect.any(String),
      'content-width-wide': expect.any(String),
      'grid-track-s': expect.any(String),
      'grid-track-m': expect.any(String),
      'example-height': expect.any(String),
      'panel-height': expect.any(String),
      'panel-bar-height': expect.any(String),
      'viewport-height-s': expect.any(String),
      'viewport-height-m': expect.any(String),
      'viewport-height-l': expect.any(String),
      'screen-height-dynamic': expect.any(String),
      'screen-height-small': expect.any(String),
      'panel-handle-size': expect.any(String),
      'panel-gutter-size': expect.any(String),
      'scrollbar-track-size': expect.any(String),
      'scrollbar-thumb-size': expect.any(String),
    })
  })

  it('exposes the reduced radius scale', () => {
    expect(borderRadii).toMatchObject({
      none: expect.any(String),
      xs: expect.any(String),
      s: expect.any(String),
      m: expect.any(String),
    })
    expect(borderRadii).not.toHaveProperty('l')
    expect(borderRadii).not.toHaveProperty('xl')
    expect(borderRadii).not.toHaveProperty('full')
  })
})

describe('primitive length policy', () => {
  it('keeps scalable primitive lengths relative to the root font size', () => {
    expect(nonzeroValues(fontSizeValues).every((value) => value.endsWith('rem'))).toBe(true)
    expect(nonzeroValues(spacingValues).every((value) => value.endsWith('rem'))).toBe(true)
    expect(nonzeroValues(borderRadiusValues).every((value) => value.endsWith('rem'))).toBe(true)
    expect(
      Object.entries(dimensionValues)
        .filter(([key]) => key !== '1' && key !== '2')
        .every(([, value]) => value.endsWith('rem')),
    ).toBe(true)
  })

  it('keeps physical boundary and focus geometry pixel-backed', () => {
    expect(dimensionValues[1]).toBe('1px')
    expect(dimensionValues[2]).toBe('2px')
  })

  it('pairs 13px interface text with an explicit 18px line height', () => {
    expect(lineHeightValues.ui).toBe('1.125rem')
  })

  it('pairs 12px compact text with an explicit 16px line height', () => {
    expect(lineHeightValues.compact).toBe('1rem')
  })
})

describe('breakpoint contract', () => {
  it('derives global media queries from one value owner', () => {
    expect(breakpointValues).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280 })
    expect(breakpointQueries.belowSm).toBe('@media (max-width: 639px)')
    expect(breakpointQueries.md).toBe('@media (min-width: 768px)')
  })
})
