interface PreparedTableLinkEvent {
  altKey: boolean
  button: number
  ctrlKey: boolean
  currentTarget: { getAttribute: (name: string) => string | null }
  defaultPrevented: boolean
  metaKey: boolean
  shiftKey: boolean
}

export function shouldPrepareTableLink(event: PreparedTableLinkEvent): boolean {
  const target = event.currentTarget.getAttribute('target')
  return (
    event.defaultPrevented === false &&
    event.button === 0 &&
    event.metaKey === false &&
    event.ctrlKey === false &&
    event.shiftKey === false &&
    event.altKey === false &&
    (target === null || target === '' || target === '_self')
  )
}
