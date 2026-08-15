import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Button, FloatingPanel } from '@inspector/ds'

import type { SpreadsheetCompletionDirection } from '@tables/grid/inlineEditing'
import type { TableMutationEditorController } from '@tables/mutationLedger/provider'
import { getMutationFieldInput } from '@tables/rowEditor/mutation/draft'
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
  const controlElementRef = useRef<HTMLElement | null>(null)
  const setControlElement = useCallback((element: HTMLElement | null) => {
    controlElementRef.current = element
  }, [])
  const input = getMutationFieldInput(controller.state.draft, column)
  const submission = controller.actions.buildSubmission()
  const error = submission.errors[column.name]
  const label = formatColumnNameLabel(column.name)
  const isStructured = isStructuredColumn(column)
  const complete = (direction: SpreadsheetCompletionDirection): boolean => {
    if (controller.actions.buildSubmission().errors[column.name] !== undefined) {
      return false
    }
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
      // Closing changes presentation only; the provider keeps this raw field input.
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
            expanded={isStructured}
            fieldState={{
              isNull: input.mode === 'null',
              isOmitted: input.mode === 'omitted',
              text: input.text,
            }}
            focusOnMount={isStructured}
            hidden={false}
            idPrefix="field-editor"
            initialValue={controller.state.draft.sourceValues[column.name]}
            onExpandedChange={() => undefined}
            onNullChange={(isNull) => controller.actions.setFieldNull(column.name, isNull)}
            onOmittedChange={(isOmitted) =>
              controller.actions.setFieldOmitted(column.name, isOmitted)
            }
            onTextChange={(text) => controller.actions.setFieldText(column.name, text)}
            readOnlyReason={getFieldReadOnlyReason(column)}
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
