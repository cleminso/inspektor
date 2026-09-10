import { Box, Icon, Input, InputGroup } from '@inspektor/ds'
import { Eye, EyeOff } from 'lucide-react'
import { type ReactElement, useState } from 'react'

export default function InputGroupInteractiveAffixDemo(): ReactElement {
  const [visible, setVisible] = useState(false)
  const [useNull, setUseNull] = useState(false)

  return (
    <Box
      width="popup-width-m"
      flexDirection="column"
      gap="m"
    >
      <InputGroup fullWidth>
        <Input
          id="connection-secret"
          aria-label="Connection secret"
          defaultValue="secret-value"
          type={visible === true ? 'text' : 'password'}
        />
        <InputGroup.Action
          label={visible === true ? 'Hide connection secret' : 'Show connection secret'}
          controls="connection-secret"
          pressed={visible}
          onClick={() => setVisible((current) => current === false)}
        >
          <Icon
            artwork={visible === true ? EyeOff : Eye}
            size="s"
          />
        </InputGroup.Action>
      </InputGroup>
      <InputGroup fullWidth>
        <Input
          aria-label="Optional value"
          disabled={useNull}
          defaultValue="Example"
        />
        <InputGroup.Checkbox
          label="Store a null value"
          checked={useNull}
          onCheckedChange={(checked) => setUseNull(checked === true)}
        >
          NULL
        </InputGroup.Checkbox>
      </InputGroup>
    </Box>
  )
}
