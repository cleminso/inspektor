import type { ConnectionDraft } from '@app/connections/connections'

export interface ConnectionFormValues extends ConnectionDraft {
  branch: string
}
