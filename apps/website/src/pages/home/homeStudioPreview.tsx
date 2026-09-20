import { BrandProductPreview } from '@inspektor/ds/brand'
import { useTheme } from 'next-themes'

import inspektorStudioDark from '../../assets/inspektorStudioDark.webp'
import inspektorStudioLight from '../../assets/inspektorStudioLight.webp'

export function HomeStudioPreview(): React.ReactElement {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'

  return (
    <BrandProductPreview
      alt="Inspektor Studio displaying a Jazz table with its schema, records, and selected row details."
      height={1660}
      src={isDarkTheme ? inspektorStudioDark : inspektorStudioLight}
      width={2862}
    />
  )
}
