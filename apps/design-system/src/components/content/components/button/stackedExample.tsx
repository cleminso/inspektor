import { Button, Text } from '@inspektor/ds'

export default function StackedExample(): React.ReactElement {
  return (
    <Button
      layout="stacked"
      variant="ghost"
      aria-label="Inspektor test app-1"
    >
      <Text
        as="span"
        color="inherit"
      >
        Inspektor test
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
