import { Box, CopyButton } from "@inspector/ds";
import * as stylex from "@stylexjs/stylex";
import { ChevronDown } from "lucide-react";
import { type ReactElement, useId, useState } from "react";

import { useHighlightedCode } from "@/lib/shiki";

export function CodeBlock({ source }: { source: string }): ReactElement {
  const code = source.trim();
  const highlightedHtml = useHighlightedCode(code);
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box
      alignItems="center"
      flexDirection="column"
      position="relative"
      backgroundColor="bg-page"
      borderColor="border"
      borderBottomLeftRadius="xl"
      borderBottomRightRadius="xl"
      borderStyle="solid"
      borderWidth={0}
      borderTopWidth={1}
    >
      <Box
        flexDirection="column"
        width="full"
        borderBottomLeftRadius="xl"
        borderBottomRightRadius="xl"
        data-state={isExpanded === true ? "open" : "closed"}
      >
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={isExpanded}
          data-state={isExpanded === true ? "open" : "closed"}
          onClick={() => {
            setIsExpanded((expanded) => expanded === false);
          }}
          {...stylex.props(styles.trigger, isExpanded === true && styles.triggerExpanded)}
        >
          <span
            aria-hidden="true"
            {...stylex.props(styles.triggerIcon, isExpanded === false && styles.triggerIconCollapsed)}
          >
            <ChevronDown size={16} />
          </span>
          {isExpanded === true ? "Hide code" : "Show code"}
        </button>
        <Box
          id={contentId}
          data-state={isExpanded === true ? "open" : "closed"}
          hidden={isExpanded === false}
          display={isExpanded === true ? "block" : "none"}
          position="relative"
          backgroundColor="bg-page"
          borderColor="border"
          borderStyle="solid"
          borderWidth={0}
          borderTopWidth={1}
        >
          <Box position="absolute" right="l" top="l" zIndex="content">
            <CopyButton textToCopy={source} label="Copy source" />
          </Box>
          {highlightedHtml !== null ? (
            <div
              data-docs-code-content
              {...stylex.props(styles.codeContent)}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre {...stylex.props(styles.pre)}>
              <code>{code}</code>
            </pre>
          )}
        </Box>
      </Box>
    </Box>
  );
}

const styles = stylex.create({
  codeContent: { display: "block" },
  trigger: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: "transparent",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 0,
    color: "inherit",
    cursor: "pointer",
    display: "flex",
    fontFamily: "'Geist', 'Inter', sans-serif",
    fontSize: 14,
    gap: 12,
    height: 48,
    outlineColor: {
      default: "transparent",
      ":focus-visible": "currentColor",
    },
    outlineOffset: -2,
    outlineStyle: "solid",
    outlineWidth: {
      default: 0,
      ":focus-visible": 2,
    },
    paddingInline: 16,
    textAlign: "left",
    width: "100%",
  },
  triggerExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerIcon: {
    display: "flex",
    flexShrink: 0,
    transform: "rotate(0deg)",
  },
  triggerIconCollapsed: {
    transform: "rotate(-90deg)",
  },
  pre: {
    color: "inherit",
    fontFamily: "'GeistMono', ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 13,
    lineHeight: "20px",
    margin: 0,
    overflowX: "auto",
    padding: "16px 48px 16px 16px",
    whiteSpace: "pre",
  },
});
