import * as stylex from '@stylexjs/stylex'
import { useLayoutEffect, useRef, useState } from 'react'

import { middleTruncateStyles } from './middleTruncate.styles'
import { getMiddleTruncatePreview } from './middleTruncateValue'

const measurementSubscriptions = new Map<Element, () => void>()
let resizeObserver: ResizeObserver | null = null
let observedFontSet: FontFaceSet | null = null

function updateMeasurements(): void {
  for (const updateMeasurement of measurementSubscriptions.values()) {
    updateMeasurement()
  }
}

function observeMeasurementChanges(element: Element, updateMeasurement: () => void): () => void {
  resizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      measurementSubscriptions.get(entry.target)?.()
    }
  })

  measurementSubscriptions.set(element, updateMeasurement)
  resizeObserver.observe(element)
  if (measurementSubscriptions.size === 1) {
    observedFontSet = document.fonts
    observedFontSet?.addEventListener('loadingdone', updateMeasurements)
  }

  return () => {
    measurementSubscriptions.delete(element)
    resizeObserver?.unobserve(element)
    if (measurementSubscriptions.size === 0) {
      resizeObserver?.disconnect()
      resizeObserver = null
      observedFontSet?.removeEventListener('loadingdone', updateMeasurements)
      observedFontSet = null
    }
  }
}

export interface MiddleTruncateProps {
  /** Complete string whose start and end remain visible when space is constrained. */
  value: string
}

export function MiddleTruncate({ value }: MiddleTruncateProps) {
  const [preview, setPreview] = useState(value)
  const rootRef = useRef<HTMLSpanElement>(null)
  const measurementRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const measurement = measurementRef.current
    if (root === null || measurement === null) {
      return
    }

    const updatePreview = () => {
      const availableWidth = root.getBoundingClientRect().width
      if (availableWidth <= 0) {
        setPreview('')
        return
      }
      const nextPreview = getMiddleTruncatePreview(value, availableWidth, (candidate) => {
        measurement.textContent = candidate
        return measurement.getBoundingClientRect().width
      })
      setPreview(nextPreview)
    }

    updatePreview()
    return observeMeasurementChanges(root, updatePreview)
  }, [value])

  return (
    <span
      ref={rootRef}
      {...stylex.props(middleTruncateStyles.root)}
      data-slot="middle-truncate"
    >
      <span
        {...stylex.props(middleTruncateStyles.preview)}
        aria-hidden="true"
        data-slot="middle-truncate-preview"
      >
        {preview}
      </span>
      <span
        ref={measurementRef}
        {...stylex.props(middleTruncateStyles.measurement)}
        aria-hidden="true"
        data-slot="middle-truncate-measurement"
      />
      <span
        {...stylex.props(middleTruncateStyles.visuallyHidden)}
        data-slot="middle-truncate-accessible-value"
      >
        {value}
      </span>
    </span>
  )
}
