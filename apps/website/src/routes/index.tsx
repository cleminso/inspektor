import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '../pages/home/homePage'

export const Route = createFileRoute('/')({
  component: HomePage,
})
