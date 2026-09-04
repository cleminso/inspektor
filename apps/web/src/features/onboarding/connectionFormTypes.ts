import type { ConnectionDraft } from '@app/connections/connections'

export interface AddConnectionFormValues extends ConnectionDraft {
  branch: string
}
