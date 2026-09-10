import { BinaryDetails, BinaryValue, Box, Toaster, type BinaryCopyFormat } from '@inspektor/ds'
import { type ReactElement } from 'react'

const value = new Uint8Array([0, 31, 127, 255])

function encode(format: BinaryCopyFormat): string {
  if (format === 'hex') {
    return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return btoa(String.fromCharCode(...value))
}

function download(): void {
  const url = URL.createObjectURL(new Blob([value], { type: 'application/octet-stream' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'sample.bin'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function BinaryDetailsDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="l"
      width="example-width"
      mx="auto"
    >
      <BinaryValue byteLength={value.byteLength} />
      <BinaryDetails
        byteLength={value.byteLength}
        onCopy={(format) => navigator.clipboard.writeText(encode(format))}
        onDownload={download}
      />
      <Toaster />
    </Box>
  )
}
