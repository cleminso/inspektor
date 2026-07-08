import * as stylex from "@stylexjs/stylex";
import { type ReactElement, type ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}): ReactElement {
  return (
    <header {...stylex.props(styles.header)}>
      {eyebrow !== undefined ? <span {...stylex.props(styles.eyebrow)}>{eyebrow}</span> : null}
      <div {...stylex.props(styles.titleGroup)}>
        <h1 {...stylex.props(styles.title)}>{title}</h1>
        {description !== undefined ? (
          <p {...stylex.props(styles.description)}>{description}</p>
        ) : null}
      </div>
    </header>
  );
}

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "oklch(0.9 0.004 286)",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 650,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "oklch(0.45 0.006 286)",
  },
  titleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: "40px",
    letterSpacing: "-0.04em",
  },
  description: {
    maxWidth: 640,
    margin: 0,
    fontSize: 17,
    lineHeight: "28px",
    color: "oklch(0.42 0.006 286)",
  },
});
