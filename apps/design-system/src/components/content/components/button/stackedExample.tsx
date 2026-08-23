import { Button, Text } from '@inspector/ds'

export default function StackedExample(): React.ReactElement {
  return (
    <Button
      layout="stacked"
      variant="ghost"
      aria-label="Inspector test app-1"
    >
      <Text
        as="span"
        color="inherit"
      >
        Inspector test
      </Text>
      <Text
        as="span"
        variant="caption"
        color="muted"
      >
        app-1
      </Text>
    </Button>
  )
}
