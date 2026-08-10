import { createPreloadableComponent } from './preloadableComponent'

const editRowForm = createPreloadableComponent(async () => {
  const module = await import('./editForm')
  return { default: module.EditRowForm }
})

const insertRowForm = createPreloadableComponent(async () => {
  const module = await import('./insertForm')
  return { default: module.InsertRowForm }
})

export const EditRowForm = editRowForm.Component
export const InsertRowForm = insertRowForm.Component

export function preloadRowEditorForms(): void {
  void Promise.allSettled([editRowForm.preload(), insertRowForm.preload()])
}
