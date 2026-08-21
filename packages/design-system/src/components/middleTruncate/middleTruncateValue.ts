const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const ellipsis = '…'
const measurementTolerance = 1

function segmentValue(value: string): string[] {
  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
}

export function getMiddleTruncatePreview(
  value: string,
  availableWidth: number,
  measure: (candidate: string) => number,
): string {
  if (measure(value) <= availableWidth) {
    return value
  }

  const graphemes = segmentValue(value)
  const fittingWidth = Math.max(0, availableWidth - measurementTolerance)
  if (measure(ellipsis) > fittingWidth) {
    return ''
  }
  let low = 0
  let high = Math.max(0, graphemes.length - 1)
  let retainedCount = 0

  while (low <= high) {
    const candidateCount = Math.floor((low + high) / 2)
    const startCount = Math.ceil(candidateCount / 2)
    const endCount = Math.floor(candidateCount / 2)
    const start = graphemes.slice(0, startCount).join('')
    const end = endCount === 0 ? '' : graphemes.slice(-endCount).join('')

    if (measure(`${start}${ellipsis}${end}`) <= fittingWidth) {
      retainedCount = candidateCount
      low = candidateCount + 1
    } else {
      high = candidateCount - 1
    }
  }

  const startCount = Math.ceil(retainedCount / 2)
  const endCount = Math.floor(retainedCount / 2)
  const start = graphemes.slice(0, startCount).join('')
  const end = endCount === 0 ? '' : graphemes.slice(-endCount).join('')
  return `${start}${ellipsis}${end}`
}
