import * as stylex from '@stylexjs/stylex'
import { useLayoutEffect, useRef, useState } from 'react'

import { middleTruncateStyles } from './middleTruncate.styles'
import { getMiddleTruncatedValue } from './middleTruncateValue'

export interface MiddleTruncateProps {
  /** Complete string whose start and end remain visible when space is constrained. */
  value: string
}

export function MiddleTruncate({ value }: MiddleTruncateProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const measurementRef = useRef<HTMLSpanElement>(null)
  const [preview, setPreview] = useState(value)

  useLayoutEffect(() => {
    const root = rootRef.current
    const measurement = measurementRef.current
    if (root === null || measurement === null) {
      return
    }

    let animationFrame: number | undefined
    let cancelled = false
    const measure = () => {
      const availableWidth = root.clientWidth
      const nextPreview = getMiddleTruncatedValue(value, (candidate) => {
        measurement.textContent = candidate
        return measurement.getBoundingClientRect().width <= availableWidth
      })
      measurement.textContent = ''

      setPreview((currentPreview) =>
        currentPreview === nextPreview ? currentPreview : nextPreview,
      )
    }
    const scheduleMeasure = () => {
      if (cancelled === true || animationFrame !== undefined) {
        return
      }

      animationFrame = requestAnimationFrame(() => {
        animationFrame = undefined
        measure()
      })
    }

    measure()

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure)
    resizeObserver?.observe(root)
    void document.fonts?.ready.then(scheduleMeasure)

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value])

  const isTruncated = preview !== value

  return (
    <span
      ref={rootRef}
      {...stylex.props(middleTruncateStyles.root)}
      data-slot="middle-truncate"
      data-truncated={isTruncated}
    >
      <span
        {...stylex.props(middleTruncateStyles.preview)}
        aria-hidden={isTruncated === true ? true : undefined}
        data-slot="middle-truncate-preview"
      >
        {preview}
      </span>
      {isTruncated === true ? (
        <span
          {...stylex.props(middleTruncateStyles.visuallyHidden)}
          data-slot="middle-truncate-accessible-value"
        >
          {value}
        </span>
      ) : null}
      <span
        ref={measurementRef}
        {...stylex.props(middleTruncateStyles.measurement)}
        aria-hidden="true"
        data-slot="middle-truncate-measurement"
      >
      </span>
    </span>
  )
}
