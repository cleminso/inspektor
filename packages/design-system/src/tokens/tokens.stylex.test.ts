import { describe, expect, it } from 'vitest'

import {
  backgroundColors,
  borderRadii,
  borderColors,
  layerIndexes,
  spatial,
  textColors,
} from './tokens.stylex'

describe('semantic token contract', () => {
  it('defines notification color roles', () => {
    expect(backgroundColors).toMatchObject({
      'bg-notification-warning': expect.any(String),
      'bg-notification-error': expect.any(String),
      'bg-notification-info': expect.any(String),
      'bg-notification-loading': expect.any(String),
    })
    expect(textColors).toMatchObject({
      'fg-notification-warning': expect.any(String),
      'fg-notification-error': expect.any(String),
      'fg-notification-info': expect.any(String),
      'fg-notification-loading': expect.any(String),
    })
    expect(borderColors).toMatchObject({
      'border-notification-warning': expect.any(String),
      'border-notification-error': expect.any(String),
      'border-notification-info': expect.any(String),
      'border-notification-loading': expect.any(String),
    })
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
      'panel-handle-size': expect.any(String),
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
