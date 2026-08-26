import { lazy } from 'react'

function createRetryableLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null
  return () => {
    promise ??= load().catch((error: unknown) => {
      promise = null
      throw error
    })
    return promise
  }
}

const loadEditRowForm = createRetryableLoader(() =>
  import('./editForm').then(({ EditRowForm }) => ({ default: EditRowForm })),
)
const loadInsertRowForm = createRetryableLoader(() =>
  import('./insertForm').then(({ InsertRowForm }) => ({ default: InsertRowForm })),
)

export const EditRowForm = lazy(loadEditRowForm)
export const InsertRowForm = lazy(loadInsertRowForm)

export function preloadRowEditorForms(): void {
  void Promise.allSettled([loadEditRowForm(), loadInsertRowForm()])
}
