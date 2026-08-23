import type { BinaryCopyFormat } from '@inspector/ds'

interface ClipboardWriter {
  writeText: (value: string) => Promise<void>
}

interface DownloadAnchor {
  click: () => void
  download: string
  href: string
}

interface BinaryDownloadEnvironment {
  createAnchor: () => DownloadAnchor
  createObjectURL: (blob: Blob) => string
  revokeObjectURL: (url: string) => void
}

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const MAX_BINARY_TEXT_COPY_BYTES = 1_048_576

function copyToArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength)
  new Uint8Array(buffer).set(value)
  return buffer
}

function encodeBase64(value: Uint8Array): string {
  let encoded = ''
  for (let index = 0; index < value.length; index += 3) {
    const first = value[index] ?? 0
    const second = value[index + 1] ?? 0
    const third = value[index + 2] ?? 0
    const chunk = (first << 16) | (second << 8) | third

    encoded += base64Alphabet[(chunk >> 18) & 63]
    encoded += base64Alphabet[(chunk >> 12) & 63]
    encoded += index + 1 < value.length ? base64Alphabet[(chunk >> 6) & 63] : '='
    encoded += index + 2 < value.length ? base64Alphabet[chunk & 63] : '='
  }
  return encoded
}

export function encodeBinaryValue(value: Uint8Array, format: BinaryCopyFormat): string {
  if (value.byteLength > MAX_BINARY_TEXT_COPY_BYTES) {
    throw new Error('Binary text copy is limited to 1 MiB.')
  }

  if (format === 'base64') {
    return encodeBase64(value)
  }

  let encoded = ''
  for (const byte of value) {
    encoded += byte.toString(16).padStart(2, '0')
  }
  return encoded
}

export async function copyBinaryValue(
  value: Uint8Array,
  format: BinaryCopyFormat,
  clipboard: ClipboardWriter = navigator.clipboard,
): Promise<void> {
  await clipboard.writeText(encodeBinaryValue(value, format))
}

export function downloadBinaryValue(
  value: Uint8Array,
  name: string,
  environment: BinaryDownloadEnvironment = {
    createAnchor: () => document.createElement('a'),
    createObjectURL: URL.createObjectURL.bind(URL),
    revokeObjectURL: URL.revokeObjectURL.bind(URL),
  },
): void {
  // Preserve the exact bytes; the Inspector cannot infer their original file type or extension.
  const url = environment.createObjectURL(
    new Blob([copyToArrayBuffer(value)], { type: 'application/octet-stream' }),
  )
  const anchor = environment.createAnchor()
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => environment.revokeObjectURL(url), 0)
}
