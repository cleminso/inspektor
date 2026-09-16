import { BrandHero } from '@inspektor/ds/brand'

export function HomeHero(): React.ReactElement {
  return (
    <BrandHero
      title="inspektor studio"
      continuation="explore your Jazz application data"
      description="Inspektor connects to your sync server. It loads the schema, creates an admin client locally in your browser, and renders an interface for you to inspect your application data."
    />
  )
}
