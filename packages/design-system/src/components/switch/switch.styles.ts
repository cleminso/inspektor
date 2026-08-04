import * as stylex from '@stylexjs/stylex'

import { backgroundColors, borderColors, spatial } from '../../tokens/semantics.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const switchStyles = stylex.create({
  root: {
    padding: spacing.xxs,
    borderColor: 'transparent',
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: backgroundColors['bg-secondary'],
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    outlineColor: borderColors['outline'],
    outlineOffset: 1,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': spatial['focus-ring-width'] },
    transitionDuration: { default: '120ms', [reducedMotion]: '0ms' },
    transitionProperty: 'background-color',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  rootChecked: {
    backgroundColor: {
      default: backgroundColors['bg-primary'],
      ':hover': backgroundColors['bg-primary-hover'],
      ':active': backgroundColors['bg-primary-hover'],
    },
  },
  rootCheckedReadOnly: {
    backgroundColor: {
      default: backgroundColors['bg-primary'],
      ':hover': backgroundColors['bg-primary'],
      ':active': backgroundColors['bg-primary'],
    },
  },
  rootInvalid: {
    borderColor: borderColors['border-danger'],
  },
  rootDisabled: {
    borderColor: {
      default: borderColors['border-secondary'],
      ':hover': borderColors['border-secondary'],
      ':active': borderColors['border-secondary'],
    },
    backgroundColor: {
      default: backgroundColors['bg-disabled'],
      ':hover': backgroundColors['bg-disabled'],
      ':active': backgroundColors['bg-disabled'],
    },
    cursor: 'not-allowed',
  },
  rootUncheckedReadOnly: {
    backgroundColor: {
      default: backgroundColors['bg-secondary'],
      ':hover': backgroundColors['bg-secondary'],
      ':active': backgroundColors['bg-secondary'],
    },
    cursor: 'default',
  },
  rootUnchecked: {},
  rootReadOnly: {},
  rootRequired: {},
  rootValid: {},
  rootTouched: {},
  rootDirty: {},
  rootFilled: {},
  rootFocused: {},
  rootSizeS: {
    height: spatial['switch-height-s'],
    width: spatial['switch-width-s'],
  },
  rootSizeM: {
    height: spatial['switch-height-m'],
    width: spatial['switch-width-m'],
  },
  thumb: {
    borderRadius: borderRadii.xs,
    backgroundColor: backgroundColors['bg-card'],
    display: 'block',
    transform: 'translateX(0)',
    transitionDuration: { default: '120ms', [reducedMotion]: '0ms' },
    transitionProperty: 'transform, background-color',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  thumbChecked: {
    backgroundColor: backgroundColors['bg-page'],
  },
  thumbUnchecked: {},
  thumbDisabled: {},
  thumbReadOnly: {},
  thumbRequired: {},
  thumbValid: {},
  thumbInvalid: {},
  thumbTouched: {},
  thumbDirty: {},
  thumbFilled: {},
  thumbFocused: {},
  thumbSizeS: {
    height: spatial['switch-thumb-s'],
    width: spatial['switch-thumb-s'],
  },
  thumbSizeSChecked: {
    transform: `translateX(calc(${spatial['switch-width-s']} - ${spatial['switch-thumb-s']} - ${spacing.xxs} - ${spacing.xxs} - 2px))`,
  },
  thumbSizeM: {
    height: spatial['switch-thumb-m'],
    width: spatial['switch-thumb-m'],
  },
  thumbSizeMChecked: {
    transform: `translateX(calc(${spatial['switch-width-m']} - ${spatial['switch-thumb-m']} - ${spacing.xxs} - ${spacing.xxs} - 2px))`,
  },
})
