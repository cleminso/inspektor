import * as stylex from '@stylexjs/stylex'
import { useEffect, useRef, useState } from 'react'

import { codeEditorStyles } from './codeEditor.styles'

type CodeMirrorEditorModule = typeof import('./codeMirrorEditor')

let codeMirrorEditorPromise: Promise<CodeMirrorEditorModule> | null = null
let loadedCodeMirrorEditor: CodeMirrorEditorModule | null = null

// Keep CodeMirror outside the static package graph. The controlled textarea remains usable while
// loading, and the promise resets after failure so another mount can retry the optional engine.
function loadCodeMirrorEditor(): Promise<CodeMirrorEditorModule> {
  codeMirrorEditorPromise ??= import('./codeMirrorEditor')
    .then((module) => {
      loadedCodeMirrorEditor = module
      return module
    })
    .catch((error: unknown) => {
      codeMirrorEditorPromise = null
      throw new Error('CodeEditor failed to load CodeMirror', { cause: error })
    })

  return codeMirrorEditorPromise
}

/** Loads the deferred editor engine before an interaction needs it. */
export function preloadCodeEditor(): Promise<void> {
  return loadCodeMirrorEditor().then(
    () => undefined,
    () => undefined,
  )
}

export type CodeEditorLayout = 'fill' | 'intrinsic'

export interface CodeEditorProps {
  /** Sets the source text displayed and edited by CodeMirror. */
  value: string
  /** Runs when editing or formatting changes the source text. */
  onValueChange?: (value: string) => void
  /** Provides an accessible name when no external label identifies the editor. */
  accessibilityLabel?: string
  /** Sets the editor control id used by an external label. */
  id?: string
  /** Identifies the external element that labels the editor. */
  labelledBy?: string
  /** Identifies external description and error elements for the editor. */
  describedBy?: string
  /** Prevents source changes while preserving focus, selection, and copying. */
  readOnly?: boolean
  /** Prevents editing and removes the editor from sequential keyboard focus. */
  disabled?: boolean
  /** Marks the editor value as invalid. */
  invalid?: boolean
  /** Controls whether the editor uses its expanded viewport. */
  expanded?: boolean
  /** Sets the initial viewport presentation when expansion is uncontrolled. */
  defaultExpanded?: boolean
  /** Runs when Expand or Collapse requests a presentation change. */
  onExpandedChange?: (expanded: boolean) => void
  /** Uses intrinsic sizing by default or fills a constrained parent when expanded. */
  layout?: CodeEditorLayout
  /** Moves focus into the editor after an explicit owner-driven mount. */
  focusOnMount?: boolean
}

export function CodeEditor({
  readOnly = false,
  disabled = false,
  invalid = false,
  defaultExpanded = false,
  focusOnMount = false,
  layout = 'intrinsic',
  ...props
}: CodeEditorProps) {
  const fallbackExpanded = props.expanded ?? defaultExpanded
  const fallbackLineCount = props.value.split('\n').length
  const fallbackRows = fallbackExpanded === true ? Math.min(fallbackLineCount, 18) : undefined
  const fallbackIsCapped =
    fallbackExpanded === true && layout === 'intrinsic' && fallbackLineCount > 18
  const fallbackRef = useRef<HTMLTextAreaElement>(null)
  const fallbackSelectionAnchorRef = useRef(fallbackIsCapped ? 0 : props.value.length)
  const restoreFocusRef = useRef(false)
  const [implementation, setImplementation] = useState<CodeMirrorEditorModule | null>(
    loadedCodeMirrorEditor,
  )
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (focusOnMount === true) {
      const fallback = fallbackRef.current
      const anchor = fallbackSelectionAnchorRef.current
      fallback?.focus()
      fallback?.setSelectionRange(anchor, anchor)
    }
  }, [focusOnMount])

  useEffect(() => {
    if (implementation !== null) {
      return
    }

    let active = true

    void loadCodeMirrorEditor()
      .then((module) => {
        if (active === false) {
          return
        }

        restoreFocusRef.current = document.activeElement === fallbackRef.current
        setImplementation(module)
      })
      .catch((error: unknown) => {
        if (active === true) {
          setLoadError(
            error instanceof Error ? error.message : 'CodeEditor failed to load CodeMirror',
          )
        }
      })

    return () => {
      active = false
    }
  }, [implementation])

  if (implementation !== null) {
    const CodeMirrorEditor = implementation.CodeMirrorEditor

    return (
      <CodeMirrorEditor
        {...props}
        readOnly={readOnly}
        disabled={disabled}
        invalid={invalid}
        defaultExpanded={defaultExpanded}
        focusOnMount={focusOnMount}
        layout={layout}
        restoreFocus={restoreFocusRef.current}
      />
    )
  }

  return (
    <div
      {...stylex.props(
        codeEditorStyles.root,
        layout === 'fill' && fallbackExpanded === true && codeEditorStyles.rootFill,
        invalid === true && codeEditorStyles.invalid,
        disabled === true && codeEditorStyles.disabled,
        readOnly === true && codeEditorStyles.readOnly,
      )}
      aria-busy={loadError === null}
      data-expanded={fallbackExpanded === true ? '' : undefined}
      data-layout={layout === 'fill' && fallbackExpanded === true ? 'fill' : 'intrinsic'}
      data-slot="code-editor"
    >
      <div
        {...stylex.props(
          codeEditorStyles.viewport,
          fallbackExpanded === true && layout === 'fill' && codeEditorStyles.viewportExpandedFill,
        )}
        data-slot="code-editor-viewport"
      >
        <textarea
          {...stylex.props(
            codeEditorStyles.fallbackInput,
            fallbackExpanded === true && codeEditorStyles.fallbackInputExpanded,
            fallbackExpanded === true &&
              layout === 'intrinsic' &&
              codeEditorStyles.fallbackInputExpandedIntrinsic,
            fallbackIsCapped && codeEditorStyles.fallbackInputExpandedCapped,
            fallbackExpanded === true &&
              layout === 'fill' &&
              codeEditorStyles.fallbackInputExpandedFill,
          )}
          ref={fallbackRef}
          id={props.id}
          value={props.value}
          aria-label={props.accessibilityLabel}
          aria-labelledby={props.labelledBy}
          aria-describedby={props.describedBy}
          aria-invalid={invalid === true ? true : undefined}
          disabled={disabled}
          readOnly={readOnly}
          rows={fallbackRows}
          data-viewport-capped={fallbackIsCapped === true ? '' : undefined}
          onChange={(event) => {
            props.onValueChange?.(event.currentTarget.value)
          }}
        />
      </div>
      <div
        {...stylex.props(codeEditorStyles.toolbar)}
        aria-hidden="true"
        data-slot="code-editor-toolbar"
      />
      {loadError !== null ? (
        <span
          {...stylex.props(codeEditorStyles.loadError)}
          role="alert"
        >
          {loadError}
        </span>
      ) : null}
    </div>
  )
}
