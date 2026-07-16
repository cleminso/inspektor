import * as stylex from '@stylexjs/stylex'

import { backgroundColors, borderColors } from '../../tokens/semantics.stylex'
import { borderRadii } from '../../tokens/value.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

export const switchStyles = stylex.create({
  root: {
    padding: 2,
    borderColor: 'transparent',
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: backgroundColors['bg-secondary'],
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    outlineColor: borderColors['border-focused'],
    outlineOffset: 1,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': 1 },
    transitionDuration: { default: '120ms', [reducedMotion]: '0ms' },
    transitionProperty: 'background-color',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  rootChecked: {
    backgroundColor: backgroundColors['bg-inverse'],
  },
  rootInvalid: {
    borderColor: borderColors['border-danger'],
  },
  rootDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  rootReadOnly: {
    cursor: 'default',
  },
  rootSizeS: {
    height: 16,
    width: 28,
  },
  rootSizeM: {
    height: 20,
    width: 36,
  },
  thumb: {
    borderRadius: borderRadii.xs,
    backgroundColor: backgroundColors['bg-primary'],
    display: 'block',
    transform: 'translateX(0)',
    transitionDuration: { default: '120ms', [reducedMotion]: '0ms' },
    transitionProperty: 'transform, background-color',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  thumbChecked: {
    backgroundColor: backgroundColors['bg-surface-1'],
  },
  thumbSizeS: {
    height: 12,
    width: 12,
  },
  thumbSizeSChecked: {
    transform: 'translateX(10px)',
  },
  thumbSizeM: {
    height: 14,
    width: 14,
  },
  thumbSizeMChecked: {
    transform: 'translateX(16px)',
  },
})
