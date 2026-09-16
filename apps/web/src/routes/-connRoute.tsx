// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { Outlet } from '@tanstack/react-router'

/**
 * Keeps `/conn` as a transparent route boundary with stable outlet ancestry.
 *
 * Do not wrap this outlet based on the current or pending location. Onboarding leaves own their
 * layouts, while `/conn/$connectionId` owns the runtime providers. Changing the wrapper here moves
 * the matched subtree to a new React position, which remounts the runtime and restarts its metadata
 * requests, Jazz client, WebSocket, subscriptions, and local component state.
 */
// @lat: [[routing#Stable route ancestry]]
export function ConnRoute(): React.ReactElement {
  return <Outlet />
}
