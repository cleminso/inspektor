import { createPreloadableComponent } from '@tables/rowEditor/preloadableComponent'

const fieldEditorMutationWidget = createPreloadableComponent(
  () => import('@tables/floatingWidget/fieldEditorMutationWidget'),
)

export const FieldEditorMutationWidget = fieldEditorMutationWidget.Component
