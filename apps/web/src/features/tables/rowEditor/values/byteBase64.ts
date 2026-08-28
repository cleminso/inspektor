const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function encodeBase64(bytes: Uint8Array): string {
  let encoded = ''

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0
    const second = bytes[index + 1] ?? 0
    const third = bytes[index + 2] ?? 0
    const chunk = (first << 16) | (second << 8) | third

    encoded += base64Alphabet[(chunk >> 18) & 63]
    encoded += base64Alphabet[(chunk >> 12) & 63]
    encoded += index + 1 < bytes.length ? base64Alphabet[(chunk >> 6) & 63] : '='
    encoded += index + 2 < bytes.length ? base64Alphabet[chunk & 63] : '='
  }

  return encoded
}
