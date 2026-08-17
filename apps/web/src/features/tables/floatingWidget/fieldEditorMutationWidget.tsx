import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Button, FloatingPanel } from '@inspector/ds'

import type { SpreadsheetCompletionDirection } from '@tables/grid/inlineEditing'
import type { TableMutationEditorController } from '@tables/mutationLedger/provider'
import {
  getMutationFieldError,
  getMutationFieldInput,
  type MutationFieldInput,
} from '@tables/rowEditor/mutation/draft'
import { getFieldReadOnlyReason } from '@tables/rowEditor/mutation/parsing'
import { MutationField } from '@tables/rowEditor/mutationField'
import {
  formatColumnNameLabel,
  isStructuredColumn,
} from '@tables/rowEditor/values/fieldPresentation'

export interface FieldEditorMutationWidgetProps {
  column: ColumnDescriptor
  controller: TableMutationEditorController
  onClose: () => void
  onComplete: (direction: SpreadsheetCompletionDirection) => void
}

export function FieldEditorMutationWidget({
  column,
  controller,
  onClose,
  onComplete,
}: FieldEditorMutationWidgetProps): React.ReactElement {
  const isStructured = isStructuredColumn(column)
  const [input, setInput] = useState<MutationFieldInput>(() =>
    getMutationFieldInput(controller.state.draft, column),
  )
  const [editorExpanded, setEditorExpanded] = useState(isStructured)
  const controlElementRef = useRef<HTMLElement | null>(null)
  const setControlElement = useCallback((element: HTMLElement | null) => {
    controlElementRef.current = element
  }, [])
  const error = getMutationFieldError(controller.state.draft, column, input)
  const label = formatColumnNameLabel(column.name)
  const complete = (direction: SpreadsheetCompletionDirection): boolean => {
    if (error !== undefined) {
      return false
    }
    controller.commitFieldInput(column.name, input)
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
            error={error}
            expanded={isStructured === true && editorExpanded === true}
            fieldState={{
              isNull: input.mode === 'null',
              isOmitted: input.mode === 'omitted',
              text: input.text,
            }}
            focusOnMount={isStructured}
            hidden={false}
            idPrefix="field-editor"
            initialValue={controller.state.draft.sourceValues[column.name]}
            onExpandedChange={setEditorExpanded}
            onNullChange={(isNull) => {
              setInput((current) => ({
                mode: isNull === true ? 'null' : 'value',
                text:
                  isNull === false && current.text.length === 0 && isStructured === true
                    ? column.column_type.type === 'Array'
                      ? '[]'
                      : '{}'
                    : current.text,
              }))
            }}
            onOmittedChange={(isOmitted) => {
              setInput((current) => ({
                ...current,
                mode: isOmitted === true ? 'omitted' : 'value',
              }))
            }}
            onTextChange={(text) => {
              setInput((current) => (current.mode === 'value' ? { ...current, text } : current))
            }}
            readOnlyReason={getFieldReadOnlyReason(column)}
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
