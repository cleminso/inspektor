import { CopyButton } from "@inspector/ds";
import * as stylex from "@stylexjs/stylex";
import { type ReactElement } from "react";

import { useHighlightedCode } from "@/lib/shiki";

export function CodeBlock({ source }: { source: string }): ReactElement {
  const code = source.trim();
  const highlightedHtml = useHighlightedCode(code);

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.copyAction)}>
        <CopyButton textToCopy={source} label="Copy source" />
      </div>
      {highlightedHtml !== null ? (
        <div
          className="docs-code-content"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre {...stylex.props(styles.pre)}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

const styles = stylex.create({
  root: {
    position: "relative",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "light-dark(#d0d7de, #30363d)",
    backgroundColor: "light-dark(#ffffff, #24292e)",
  },
  copyAction: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  pre: {
    margin: 0,
    padding: "16px 48px 16px 16px",
    overflowX: "auto",
    fontFamily: "'GeistMono', ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 13,
    lineHeight: "20px",
    color: "light-dark(#24292e, #e1e4e8)",
    whiteSpace: "pre",
  },
});
