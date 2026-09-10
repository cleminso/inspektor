import tsx from '@shikijs/langs-precompiled/tsx'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRawEngine } from 'shiki/engine/javascript'
import githubDark from 'shiki/themes/github-dark.mjs'
import minLight from 'shiki/themes/min-light.mjs'
import { useEffect, useState } from 'react'

const highlighterPromise = createHighlighterCore({
  themes: [minLight, githubDark],
  langs: [tsx],
  engine: createJavaScriptRawEngine(),
})

export function useHighlightedCode(code: string): string | null {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    setHtml(null)

    void highlighterPromise
      .then((highlighter) => {
        if (isCancelled === true) {
          return
        }

        setHtml(
          highlighter.codeToHtml(code, {
            lang: 'tsx',
            tabindex: false,
            themes: {
              light: 'min-light',
              dark: 'github-dark',
            },
          }),
        )
      })
      .catch(() => {
        if (isCancelled === false) {
          setHtml(null)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [code])

  return html
}
