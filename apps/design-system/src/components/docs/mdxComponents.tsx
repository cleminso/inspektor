import { Box, Text, TextLink } from '@inspektor/ds'
import { type MDXComponents } from 'mdx/types'
import { type ComponentPropsWithoutRef, type ReactElement } from 'react'

function Heading2({ children, id }: ComponentPropsWithoutRef<'h2'>): ReactElement {
  return (
    <Box paddingTop="2xl">
      <Text
        as="h2"
        id={id}
        variant="heading"
      >
        {children}
      </Text>
    </Box>
  )
}

function Heading3({ children, id }: ComponentPropsWithoutRef<'h3'>): ReactElement {
  return (
    <Box paddingTop="l">
      <Text
        as="h3"
        id={id}
        variant="title"
      >
        {children}
      </Text>
    </Box>
  )
}

function Paragraph({ children }: ComponentPropsWithoutRef<'p'>): ReactElement {
  return (
    <Text
      as="p"
      variant="body"
      color="muted"
    >
      {children}
    </Text>
  )
}

function UnorderedList({ children }: ComponentPropsWithoutRef<'ul'>): ReactElement {
  return (
    <Box
      as="ul"
      data-docs-list="unordered"
      paddingLeft="xl"
    >
      {children}
    </Box>
  )
}

function OrderedList({ children }: ComponentPropsWithoutRef<'ol'>): ReactElement {
  return (
    <Box
      as="ol"
      data-docs-list="ordered"
      paddingLeft="xl"
    >
      {children}
    </Box>
  )
}

function ListItem({ children }: ComponentPropsWithoutRef<'li'>): ReactElement {
  return <Box as="li">{children}</Box>
}

function Anchor({ children, href, title }: ComponentPropsWithoutRef<'a'>): ReactElement {
  return (
    <TextLink
      href={href}
      title={title}
    >
      {children}
    </TextLink>
  )
}

function Strong({ children }: ComponentPropsWithoutRef<'strong'>): ReactElement {
  return <Text as="strong">{children}</Text>
}

function Emphasis({ children }: ComponentPropsWithoutRef<'em'>): ReactElement {
  return <Text as="em">{children}</Text>
}

function InlineCode({ children }: ComponentPropsWithoutRef<'code'>): ReactElement {
  return (
    <Text
      as="code"
      variant="caption"
      monospace
    >
      {children}
    </Text>
  )
}

function Preformatted({ children }: ComponentPropsWithoutRef<'pre'>): ReactElement {
  return (
    <Text
      as="pre"
      monospace
    >
      {children}
    </Text>
  )
}

export const mdxComponents = {
  a: Anchor,
  code: InlineCode,
  em: Emphasis,
  h2: Heading2,
  h3: Heading3,
  li: ListItem,
  ol: OrderedList,
  p: Paragraph,
  pre: Preformatted,
  strong: Strong,
  ul: UnorderedList,
} satisfies MDXComponents
