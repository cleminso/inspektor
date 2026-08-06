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

export function splitMiddleTruncateValue(value: string): { start: string; end: string } {
  const graphemes = segmentValue(value)
  const midpoint = Math.ceil(graphemes.length / 2)

  return {
    start: graphemes.slice(0, midpoint).join(''),
    end: graphemes.slice(midpoint).join(''),
  }
}
