const ellipsis = '…'
const graphemeSegmenter =
  typeof Intl.Segmenter === 'undefined'
    ? null
    : new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function segmentValue(value: string): string[] {
  if (graphemeSegmenter === null) {
    return Array.from(value)
  }

  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
}

export function getMiddleTruncatedValue(
  value: string,
  fits: (candidate: string) => boolean,
): string {
  if (fits(value)) {
    return value
  }

  if (fits(ellipsis) === false) {
    return ''
  }

  const graphemes = segmentValue(value)
  let lowerBound = 2
  let upperBound = graphemes.length - 1
  let result = ellipsis

  while (lowerBound <= upperBound) {
    const visibleCount = Math.floor((lowerBound + upperBound) / 2)
    const startCount = Math.ceil(visibleCount / 2)
    const endCount = Math.floor(visibleCount / 2)
    const candidate = `${graphemes.slice(0, startCount).join('')}${ellipsis}${graphemes
      .slice(graphemes.length - endCount)
      .join('')}`

    if (fits(candidate)) {
      result = candidate
      lowerBound = visibleCount + 1
    } else {
      upperBound = visibleCount - 1
    }
  }

  return result
}
