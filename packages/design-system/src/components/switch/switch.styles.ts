import * as stylex from '@stylexjs/stylex'

import {
  accentElementColors,
  borderColors,
  elementColors,
  focusColors,
  spatial,
  surfaceColors,
} from '../../tokens/semantics.stylex'
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
    backgroundColor: elementColors.default,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    outlineColor: focusColors.ring,
    outlineOffset: 1,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': spatial['focus-ring-width'] },
    transitionDuration: { default: '120ms', [reducedMotion]: '0ms' },
    transitionProperty: 'background-color',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  rootChecked: {
    backgroundColor: {
      default: accentElementColors.default,
      ':hover': accentElementColors.hover,
      ':active': accentElementColors.pressed,
    },
  },
  rootCheckedReadOnly: {
    backgroundColor: {
      default: accentElementColors.default,
      ':hover': accentElementColors.default,
      ':active': accentElementColors.default,
    },
  },
  rootInvalid: {
    borderColor: borderColors.danger,
  },
  rootDisabled: {
    borderColor: {
      default: borderColors.subtle,
      ':hover': borderColors.subtle,
      ':active': borderColors.subtle,
    },
    backgroundColor: {
      default: elementColors.disabled,
      ':hover': elementColors.disabled,
      ':active': elementColors.disabled,
    },
    cursor: 'not-allowed',
  },
  rootUncheckedReadOnly: {
    backgroundColor: {
      default: elementColors.default,
      ':hover': elementColors.default,
      ':active': elementColors.default,
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
    backgroundColor: surfaceColors.default,
    display: 'block',
    transform: 'translateX(0)',
    transitionDuration: { default: '120ms', [reducedMotion]: '0ms' },
    transitionProperty: 'transform, background-color',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  thumbChecked: {
    backgroundColor: surfaceColors.background,
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
