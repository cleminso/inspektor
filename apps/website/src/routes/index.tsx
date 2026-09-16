import { createFileRoute } from '@tanstack/react-router'
import { BrandHero, BrandPageFrame, BrandText, BrandWordmark } from '@inspektor/ds/brand'

export const Route = createFileRoute('/')({
  component: WebsitePage,
})

export function WebsitePage(): React.ReactElement {
  return (
    <BrandPageFrame>
      <BrandPageFrame.Header>
        <BrandWordmark />
      </BrandPageFrame.Header>
      <BrandPageFrame.Main>
        <BrandHero>
          <BrandHero.Content>
            <BrandHero.Frame>
              <BrandHero.Message>
                <BrandHero.Headings>
                  <BrandText variant="pageHeading">inspektor studio</BrandText>
                  <BrandText variant="sectionHeading">
                    <BrandText.Line>inspect your Jazz</BrandText.Line>{' '}
                    <BrandText.Line>application data</BrandText.Line>
                  </BrandText>
                </BrandHero.Headings>
                <BrandText variant="description">
                  Inspektor connects to your sync server. It loads the schema, creates an admin
                  client locally in your browser, and renders an interface for you to inspect your
                  application data.
                </BrandText>
              </BrandHero.Message>
            </BrandHero.Frame>
          </BrandHero.Content>
        </BrandHero>
      </BrandPageFrame.Main>
      <BrandPageFrame.Footer aria-hidden="true" />
    </BrandPageFrame>
  )
}
