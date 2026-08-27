// @vitest-environment node

import { describe, expectTypeOf, it } from 'vitest'

import type { ComboboxContentProps, ComboboxPositionerProps } from '../components/combobox/combobox'
import type {
  ContextMenuContentProps,
  ContextMenuPositionerProps,
} from '../components/contextMenu/contextMenu'
import type { ContextSwitcherContentProps } from '../components/contextSwitcher/contextSwitcher'
import type { MenuContentProps, MenuPositionerProps } from '../components/menu/menu'
import type { MultiSelectContentProps } from '../components/multiSelect/multiSelect'
import type { SelectContentProps } from '../components/select/select'
import type { TooltipContentProps } from '../components/tooltip/tooltip'

type ExposesArbitraryOffsets<Props> =
  | ('sideOffset' extends keyof Props ? true : false)
  | ('alignOffset' extends keyof Props ? true : false)
  | ('collisionAvoidance' extends keyof Props ? true : false)

type ExposesSemanticSide<Props> = 'side' extends keyof Props ? true : false
type ExposesSemanticAlign<Props> = 'align' extends keyof Props ? true : false
type ExposesSelectedItemAlignment<Props> = 'alignItemWithTrigger' extends keyof Props ? true : false

describe('popup positioning contract', () => {
  it('keeps arbitrary positioning geometry internal', () => {
    expectTypeOf<ExposesArbitraryOffsets<MenuPositionerProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<MenuContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<ContextMenuPositionerProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<ContextMenuContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<ComboboxPositionerProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<ComboboxContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<ContextSwitcherContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<SelectContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<MultiSelectContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesArbitraryOffsets<TooltipContentProps>>().toEqualTypeOf<false>()
  })

  it('keeps selected-item positioning internal', () => {
    expectTypeOf<ExposesSemanticSide<SelectContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesSemanticAlign<SelectContentProps>>().toEqualTypeOf<false>()
    expectTypeOf<ExposesSelectedItemAlignment<SelectContentProps>>().toEqualTypeOf<false>()
  })
})
