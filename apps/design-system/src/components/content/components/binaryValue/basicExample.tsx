import { BinaryDetails, BinaryValue, Box, Toaster, type BinaryCopyFormat } from '@inspektor/ds'
import { type ReactElement } from 'react'

const value = new Uint8Array([0, 31, 127, 255])

function encode(value: Uint8Array, format: BinaryCopyFormat): string {
  if (format === 'hex') {
    return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return btoa(String.fromCharCode(...value))
}

async function copy(format: BinaryCopyFormat): Promise<void> {
  await navigator.clipboard.writeText(encode(value, format))
}

function download(): void {
  const url = URL.createObjectURL(new Blob([value], { type: 'application/octet-stream' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'sample.bin'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function BasicExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="l"
      width="full"
    >
      <BinaryValue byteLength={value.byteLength} />
      <BinaryDetails
        byteLength={value.byteLength}
        onCopy={copy}
        onDownload={download}
      />
      <Toaster />
    </Box>
  )
}
