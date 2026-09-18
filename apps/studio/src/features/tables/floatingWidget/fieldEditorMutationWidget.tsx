import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Button, FloatingPanel } from '@inspektor/ds'

import type { SpreadsheetCompletionDirection } from '@tables/grid/inlineEditing'
import { useTableMutationEditorController } from '@tables/mutationLedger/provider'
import {
  getMutationFieldError,
  getMutationFieldInput,
  type MutationFieldInput,
} from '@tables/rowEditor/mutation/draft'
import { getFieldReadOnlyReason } from '@tables/schema/fieldEditability'
import { MutationField } from '@tables/rowEditor/mutationField'
import { formatColumnNameLabel } from '@tables/rowEditor/values/fieldPresentation'
import { isStructuredColumnType } from '@tables/schema/fieldType'

interface FieldEditorMutationWidgetProps {
  column: ColumnDescriptor
  onClose: () => void
  onComplete: (direction: SpreadsheetCompletionDirection) => void
  rowId: string
  rowValues: Record<string, unknown>
}

function FieldEditorMutationWidget({
  column,
  onClose,
  onComplete,
  rowId,
  rowValues,
}: FieldEditorMutationWidgetProps): React.ReactElement {
  const controller = useTableMutationEditorController({ initialRowValues: rowValues, rowId })
  const isStructured = isStructuredColumnType(column.column_type)
  const [input, setInput] = useState<MutationFieldInput>(() =>
    getMutationFieldInput(controller.state.draft, column),
  )
  const [editorExpanded, setEditorExpanded] = useState(isStructured)
  const [showValidation, setShowValidation] = useState(false)
  const controlElementRef = useRef<HTMLElement | null>(null)
  const setControlElement = useCallback((element: HTMLElement | null) => {
    controlElementRef.current = element
  }, [])
  const error = getMutationFieldError(controller.state.draft, column, input)
  const label = formatColumnNameLabel(column.name)
  const complete = (direction: SpreadsheetCompletionDirection): boolean => {
    if (error !== undefined) {
      setShowValidation(true)
      return false
    }
    controller.actions.setFieldInput(column.name, input)
    onComplete(direction)
    return true
  }
  const handleKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented === true) {
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (isStructured === true) {
      if (event.key === 'Enter' && (event.metaKey === true || event.ctrlKey === true)) {
        event.preventDefault()
        event.stopPropagation()
        complete('enter')
      }
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      complete(event.shiftKey === true ? 'tabBackward' : 'tabForward')
      return
    }
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault()
      event.stopPropagation()
      complete('enter')
    }
  }

  useEffect(() => {
    controlElementRef.current?.focus()
  }, [])

  return (
    <FloatingPanel.Root aria-label={`Edit ${label}`}>
      <FloatingPanel.Content>
        <Box
          flexDirection="column"
          gap="m"
          padding="m"
          onKeyDownCapture={handleKeyDownCapture}
        >
          <MutationField
            canOmit={false}
            column={column}
            controlRef={setControlElement}
            error={showValidation === true ? error : undefined}
            expanded={isStructured === true && editorExpanded === true}
            input={input}
            focusOnMount={isStructured}
            hidden={false}
            idPrefix="field-editor"
            initialValue={controller.state.draft.sourceValues[column.name]}
            onExpandedChange={setEditorExpanded}
            onInputChange={setInput}
            readOnlyReason={getFieldReadOnlyReason(column)}
            sourceUnavailable={rowValues[column.name] === undefined}
            structuredEditorLayout="intrinsic"
          />
          <FloatingPanel.Actions>
            <Button
              size="s"
              variant="ghost"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              size="s"
              onClick={() => complete('enter')}
            >
              Save
            </Button>
          </FloatingPanel.Actions>
        </Box>
      </FloatingPanel.Content>
    </FloatingPanel.Root>
  )
}

export default FieldEditorMutationWidget
