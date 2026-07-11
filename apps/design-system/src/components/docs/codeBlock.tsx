import { Button, useClipboard } from "@inspector/ds";
import * as stylex from "@stylexjs/stylex";
import { Check, Copy } from "lucide-react";
import { type ReactElement } from "react";

import { useHighlightedCode } from "@/lib/shiki";

export function CodeBlock({ source }: { source: string }): ReactElement {
  const { copied, error, copy } = useClipboard();
  const code = source.trim();
  const highlightedHtml = useHighlightedCode(code);

  const handleCopy = (): void => {
    void copy(source).catch(() => undefined);
  };

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.copyAction)}>
        <Button
          variant="ghost"
          size="icon-s"
          onClick={handleCopy}
          aria-label={copied === true ? "Copied source" : "Copy source"}
          render={<button title={copied === true ? "Copied" : "Copy source"} />}
        >
          {copied === true ? (
            <Check aria-hidden="true" size={14} />
          ) : (
            <Copy aria-hidden="true" size={14} />
          )}
        </Button>
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
      {error !== null ? (
        <span role="status" {...stylex.props(styles.error)}>
          Source could not be copied.
        </span>
      ) : null}
      <span aria-live="polite" {...stylex.props(styles.visuallyHidden)}>
        {copied === true ? "Source copied to clipboard." : ""}
      </span>
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
  error: {
    display: "block",
    padding: "0 16px 12px",
    fontSize: 12,
    color: "light-dark(oklch(0.627 0.192 6.574), oklch(0.706 0.194 8.454))",
  },
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});
