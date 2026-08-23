import { Box, Text, Toaster, toasts } from '@inspector/ds'
import {
  paletteValues,
  type BackgroundColorToken,
  type BorderColorToken,
  type PaletteToken,
  type TextColorToken,
} from '@inspector/ds/theme'
import * as stylex from '@stylexjs/stylex'
import { type ReactElement } from 'react'
import { useTheme } from 'next-themes'

import { FoundationDocsPage } from '@/components/docs/foundationDocsPage'
import { Section } from '@/components/docs/section'
import { colorsFoundationItem } from '@/lib/registry'

const scaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

type ScaleStep = (typeof scaleSteps)[number]
type ThemeMode = 'light' | 'dark'
type ScaleName =
  | 'gray'
  | 'grayAlpha'
  | 'neutral'
  | 'neutralAlpha'
  | 'blue'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'

interface ColorSwatch {
  label: string
  token: PaletteToken
  value: string
}

interface ColorScale {
  label: string
  swatches: ColorSwatch[]
}

interface SemanticColorRole {
  label: string
  token: string
  style: keyof typeof semanticColorAppearances
}

interface SemanticColorGroup {
  label: string
  description: string
  roles: SemanticColorRole[]
}

interface SemanticColorAppearance {
  backgroundColor: BackgroundColorToken
  borderColor?: BorderColorToken
  color?: TextColorToken
  sample?: string
}

const semanticColorAppearances = {
  surfaceBackground: { backgroundColor: 'surface-background' },
  surfaceDefault: { backgroundColor: 'surface-default' },
  surfaceRaised: { backgroundColor: 'surface-raised' },
  surfaceSunken: { backgroundColor: 'surface-canvas' },
  surfaceSubtle: { backgroundColor: 'surface-subtle' },
  surfaceInverse: { backgroundColor: 'surface-inverse' },
  elementDefault: { backgroundColor: 'element-default' },
  elementHover: { backgroundColor: 'element-hover' },
  elementPressed: { backgroundColor: 'element-pressed' },
  elementSelected: { backgroundColor: 'element-selected' },
  elementDisabled: { backgroundColor: 'element-disabled' },
  ghostDefault: { backgroundColor: 'ghost-element-default' },
  ghostHover: { backgroundColor: 'ghost-element-hover' },
  ghostPressed: { backgroundColor: 'ghost-element-pressed' },
  ghostSelected: { backgroundColor: 'ghost-element-selected' },
  ghostDisabled: { backgroundColor: 'ghost-element-disabled' },
  accentDefault: { backgroundColor: 'accent-element-default' },
  accentHover: { backgroundColor: 'accent-element-hover' },
  accentPressed: { backgroundColor: 'accent-element-pressed' },
  dangerDefault: { backgroundColor: 'danger-element-default' },
  dangerHover: { backgroundColor: 'danger-element-hover' },
  dangerPressed: { backgroundColor: 'danger-element-pressed' },
  textDefault: { backgroundColor: 'surface-default', color: 'default', sample: 'Aa' },
  textSecondary: { backgroundColor: 'surface-default', color: 'secondary', sample: 'Aa' },
  textMuted: { backgroundColor: 'surface-default', color: 'muted', sample: 'Aa' },
  textPlaceholder: { backgroundColor: 'surface-default', color: 'placeholder', sample: 'Aa' },
  textDisabled: { backgroundColor: 'surface-default', color: 'disabled', sample: 'Aa' },
  textAccent: { backgroundColor: 'surface-default', color: 'accent', sample: 'Aa' },
  textDanger: { backgroundColor: 'surface-default', color: 'danger', sample: 'Aa' },
  borderDefault: { backgroundColor: 'surface-default', borderColor: 'default' },
  borderSubtle: { backgroundColor: 'surface-default', borderColor: 'subtle' },
  borderStrong: { backgroundColor: 'surface-default', borderColor: 'strong' },
  borderFocused: { backgroundColor: 'surface-default', borderColor: 'focused' },
  focusRing: { backgroundColor: 'surface-default', borderColor: 'focused' },
  selectionBackground: { backgroundColor: 'selection-background' },
  selectionStrongBackground: { backgroundColor: 'selection-strong-background' },
} as const satisfies Record<string, SemanticColorAppearance>

function getSemanticColorAppearance(
  style: keyof typeof semanticColorAppearances,
): SemanticColorAppearance {
  return semanticColorAppearances[style]
}

const semanticColorGroups: SemanticColorGroup[] = [
  {
    label: 'Surface',
    description: 'Structural backgrounds shared by pages, containers, and floating content.',
    roles: [
      { label: 'Background', token: 'surface.background', style: 'surfaceBackground' },
      { label: 'Surface', token: 'surface.default', style: 'surfaceDefault' },
      { label: 'Raised', token: 'surface.raised', style: 'surfaceRaised' },
      { label: 'Sunken', token: 'surface.canvas', style: 'surfaceSunken' },
      { label: 'Subtle', token: 'surface.subtle', style: 'surfaceSubtle' },
      { label: 'Inverse', token: 'surface.inverse', style: 'surfaceInverse' },
    ],
  },
  {
    label: 'Element',
    description: 'Filled interactive elements and their mutually exclusive interaction states.',
    roles: [
      { label: 'Default', token: 'element.default', style: 'elementDefault' },
      { label: 'Hover', token: 'element.hover', style: 'elementHover' },
      { label: 'Pressed', token: 'element.pressed', style: 'elementPressed' },
      { label: 'Selected', token: 'element.selected', style: 'elementSelected' },
      { label: 'Disabled', token: 'element.disabled', style: 'elementDisabled' },
    ],
  },
  {
    label: 'Ghost element',
    description:
      'Transparent interactive elements that reveal state without introducing a resting surface.',
    roles: [
      { label: 'Default', token: 'ghostElement.default', style: 'ghostDefault' },
      { label: 'Hover', token: 'ghostElement.hover', style: 'ghostHover' },
      { label: 'Pressed', token: 'ghostElement.pressed', style: 'ghostPressed' },
      { label: 'Selected', token: 'ghostElement.selected', style: 'ghostSelected' },
      { label: 'Disabled', token: 'ghostElement.disabled', style: 'ghostDisabled' },
    ],
  },
  {
    label: 'Accent and danger',
    description:
      'Intent-bearing interactive surfaces with their own hover and pressed progressions.',
    roles: [
      { label: 'Accent', token: 'accentElement.default', style: 'accentDefault' },
      { label: 'Accent hover', token: 'accentElement.hover', style: 'accentHover' },
      { label: 'Accent pressed', token: 'accentElement.pressed', style: 'accentPressed' },
      { label: 'Danger', token: 'dangerElement.default', style: 'dangerDefault' },
      { label: 'Danger hover', token: 'dangerElement.hover', style: 'dangerHover' },
      { label: 'Danger pressed', token: 'dangerElement.pressed', style: 'dangerPressed' },
    ],
  },
  {
    label: 'Text',
    description: 'Content hierarchy, interaction emphasis, status, and on-color foregrounds.',
    roles: [
      { label: 'Default', token: 'text.default', style: 'textDefault' },
      { label: 'Secondary', token: 'text.secondary', style: 'textSecondary' },
      { label: 'Muted', token: 'text.muted', style: 'textMuted' },
      { label: 'Placeholder', token: 'text.placeholder', style: 'textPlaceholder' },
      { label: 'Disabled', token: 'text.disabled', style: 'textDisabled' },
      { label: 'Accent', token: 'text.accent', style: 'textAccent' },
      { label: 'Danger', token: 'text.danger', style: 'textDanger' },
    ],
  },
  {
    label: 'Border, focus, and selection',
    description: 'Boundaries and orthogonal indicators that can coexist with element state.',
    roles: [
      { label: 'Default', token: 'border.default', style: 'borderDefault' },
      { label: 'Subtle', token: 'border.subtle', style: 'borderSubtle' },
      { label: 'Strong', token: 'border.strong', style: 'borderStrong' },
      { label: 'Focused', token: 'border.focused', style: 'borderFocused' },
      { label: 'Focus ring', token: 'focus.ring', style: 'focusRing' },
      { label: 'Selection', token: 'selection.background', style: 'selectionBackground' },
      {
        label: 'Strong selection',
        token: 'selection.strongBackground',
        style: 'selectionStrongBackground',
      },
    ],
  },
]

function getScaleToken(scaleName: ScaleName, step: ScaleStep): PaletteToken {
  return `${scaleName}${step}` as PaletteToken
}

function getSwatch(scaleName: ScaleName, step: ScaleStep): ColorSwatch {
  const token = getScaleToken(scaleName, step)

  return {
    label: String(step),
    token,
    value: paletteValues[token],
  }
}

function getScale(label: string, scaleName: ScaleName): ColorScale {
  return {
    label,
    swatches: scaleSteps.map((step) => getSwatch(scaleName, step)),
  }
}

function getBackgroundScale(mode: ThemeMode): ColorScale {
  const backgroundSwatches =
    mode === 'dark'
      ? [getSwatch('neutral', 50), getSwatch('neutral', 100)]
      : [getSwatch('gray', 50), getSwatch('gray', 100)]

  return {
    label: 'Backgrounds',
    swatches: backgroundSwatches.map((swatch, index) => ({
      ...swatch,
      label: `Background ${index + 1}`,
    })),
  }
}

function getModeScales(mode: ThemeMode): ColorScale[] {
  const neutralScales =
    mode === 'dark'
      ? [getScale('Neutral', 'neutral'), getScale('Neutral alpha', 'neutralAlpha')]
      : [getScale('Gray', 'gray'), getScale('Gray alpha', 'grayAlpha')]

  return [
    getBackgroundScale(mode),
    ...neutralScales,
    getScale('Blue', 'blue'),
    getScale('Red', 'red'),
    getScale('Orange', 'orange'),
    getScale('Yellow', 'yellow'),
    getScale('Green', 'green'),
  ]
}

async function copyColorValue(swatch: ColorSwatch): Promise<void> {
  try {
    await navigator.clipboard.writeText(swatch.value)
    toasts.success('Color copied', {
      description: `${swatch.token}: ${swatch.value}`,
    })
  } catch {
    toasts.error('Could not copy color', {
      description: swatch.value,
    })
  }
}

function ColorSwatchButton({ swatch }: { swatch: ColorSwatch }): ReactElement {
  return (
    <li {...stylex.props(styles.swatchItem)}>
      <button
        type="button"
        aria-label={`Copy ${swatch.token} value`}
        onClick={() => {
          void copyColorValue(swatch)
        }}
        {...stylex.props(styles.swatchButton)}
        style={{ backgroundColor: swatch.value }}
      />
    </li>
  )
}

function ScaleStepHeader(): ReactElement {
  return (
    <Box
      aria-hidden="true"
      display={{ base: 'none', md: 'grid' }}
      gridTemplateColumns="label-content"
      alignItems="center"
      gap="m"
      width="full"
    >
      <Box as="span" />
      <Box
        minWidth={0}
        gap={{ base: 'xs', md: 'm' }}
        width="full"
      >
        {scaleSteps.map((step) => (
          <span
            key={step}
            {...stylex.props(styles.stepHeaderItem)}
          >
            {step}
          </span>
        ))}
      </Box>
    </Box>
  )
}

function ColorScaleRow({ scale }: { scale: ColorScale }): ReactElement {
  const labelId = `color-scale-${scale.label.toLowerCase().replaceAll(' ', '-')}`

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: 'one', md: 'label-content' }}
      alignItems={{ base: 'start', md: 'center' }}
      gap="m"
      width="full"
    >
      <Text
        id={labelId}
        as="h3"
        variant="title"
      >
        {scale.label}
      </Text>
      <ul
        aria-describedby={labelId}
        {...stylex.props(styles.swatchList)}
      >
        {scale.swatches.map((swatch) => (
          <ColorSwatchButton
            key={swatch.token}
            swatch={swatch}
          />
        ))}
      </ul>
    </Box>
  )
}

function SemanticColorGroup({ group }: { group: SemanticColorGroup }): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <Box
        flexDirection="column"
        gap="xs"
      >
        <Text
          as="h3"
          variant="title"
        >
          {group.label}
        </Text>
        <Text color="muted">{group.description}</Text>
      </Box>
      <ul {...stylex.props(styles.semanticList)}>
        {group.roles.map((role) => (
          <li
            key={role.token}
            {...stylex.props(styles.semanticItem)}
          >
            <Box
              as="span"
              aria-hidden="true"
              alignItems="center"
              backgroundColor={getSemanticColorAppearance(role.style).backgroundColor}
              borderColor={getSemanticColorAppearance(role.style).borderColor ?? 'default'}
              borderRadius="s"
              borderStyle="solid"
              borderWidth={1}
              color={getSemanticColorAppearance(role.style).color}
              height="control-height-m"
              justifyContent="center"
              width="control-height-m"
            >
              {getSemanticColorAppearance(role.style).sample}
            </Box>
            <span {...stylex.props(styles.semanticLabel)}>{role.label}</span>
            <code {...stylex.props(styles.semanticToken)}>{role.token}</code>
          </li>
        ))}
      </ul>
    </Box>
  )
}

export function ColorFoundationPage(): ReactElement {
  const { resolvedTheme } = useTheme()
  const mode: ThemeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
  const scales = getModeScales(mode)

  return (
    <>
      <FoundationDocsPage item={colorsFoundationItem}>
        <Section
          title="Scales"
          description="Primitive color scales from value.stylex.ts. Select a swatch to copy its OKLCH value. Light mode shows gray scales; dark mode shows neutral scales."
        >
          <Box
            flexDirection="column"
            gap="2xl"
            paddingBottom="xs"
          >
            <ScaleStepHeader />
            {scales.map((scale) => (
              <ColorScaleRow
                key={scale.label}
                scale={scale}
              />
            ))}
          </Box>
        </Section>

        <Section
          title="Interface semantics"
          description="Reusable color roles are grouped by visual responsibility. Component colors link to these roles instead of adding component names to the interface namespace."
        >
          <Box
            flexDirection="column"
            gap="3xl"
          >
            {semanticColorGroups.map((group) => (
              <SemanticColorGroup
                key={group.label}
                group={group}
              />
            ))}
          </Box>
        </Section>

        <Section
          title="Component semantics"
          description="Components with distinct visual state models own private linked tokens. DataGrid defines header, row, column, cell, and focus roles; WorkspaceTabs defines resting, hover, selected, disabled, text, and focus roles."
        >
          <Text color="muted">
            Component tokens remain beside their implementation and link to interface semantics by
            default. They are promoted to the public theme contract only when consumers need to tune
            them independently.
          </Text>
        </Section>
      </FoundationDocsPage>
      <Toaster />
    </>
  )
}

const styles = stylex.create({
  swatchList: {
    display: 'flex',
    gap: {
      default: 4,
      '@media (min-width: 768px)': 8,
    },
    listStyle: 'none',
    margin: 0,
    minWidth: 0,
    padding: 0,
    width: '100%',
  },
  swatchItem: {
    flexShrink: 1,
    maxWidth: 68,
    width: '100%',
  },
  stepHeaderItem: {
    color: 'light-dark(oklch(0.205 0 none), oklch(0.97 0 none))',
    fontFamily: "'Geist Variable', 'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '20px',
    maxWidth: 68,
    textAlign: 'center',
    width: '100%',
  },
  swatchButton: {
    appearance: 'none',
    aspectRatio: {
      default: '1 / 1',
      '@media (min-width: 768px)': 'auto',
    },
    backgroundColor: 'transparent',
    borderColor: 'light-dark(oklch(0.922 0 none), oklch(0.269 0 none))',
    borderRadius: 6,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: 'inherit',
    cursor: 'copy',
    display: 'flex',
    flexGrow: 1,
    font: 'inherit',
    height: {
      default: 'auto',
      '@media (min-width: 768px)': 40,
    },
    minWidth: 0,
    padding: 0,
    width: '100%',
  },
  semanticList: {
    display: 'grid',
    gap: 8,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  semanticItem: {
    alignItems: 'center',
    display: 'grid',
    gap: 8,
    gridTemplateColumns: '24px minmax(0, 1fr)',
    paddingBlock: 4,
  },
  semanticLabel: {
    color: 'inherit',
    fontFamily: "'Geist Variable', 'Inter', sans-serif",
    fontSize: 13,
    lineHeight: '18px',
    minWidth: 0,
  },
  semanticToken: {
    color: 'inherit',
    fontFamily: "'Geist Mono Variable', ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 12,
    lineHeight: '16px',
    minWidth: 0,
  },
})
