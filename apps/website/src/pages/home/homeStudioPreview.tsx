import { BrandProductPreview } from '@inspektor/ds/brand'
import { useTheme } from 'next-themes'

export function HomeStudioPreview(): React.ReactElement {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'

  return (
    <BrandProductPreview
      alt="Inspektor Studio displaying a Jazz table with its schema, records, and selected row details."
      height={1660}
      src={isDarkTheme ? '/images/inspektorStudioDark.webp' : '/images/inspektorStudioLight.webp'}
      width={2862}
    />
  )
}
