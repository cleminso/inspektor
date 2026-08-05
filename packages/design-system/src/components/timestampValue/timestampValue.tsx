import * as stylex from "@stylexjs/stylex";

import { timestampValueStyles } from "./timestampValue.styles";

export interface TimestampValueProps {
  /** Epoch milliseconds or a Date. Invalid values render an explicit fallback. */
  value: number | Date;
}

const localFormatter = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  second: "2-digit",
  year: "numeric",
});

function formatUtc(epochMilliseconds: number): string {
  return new Date(epochMilliseconds).toISOString();
}

function getEpochMilliseconds(value: number | Date): number | undefined {
  const epochMilliseconds = value instanceof Date ? value.getTime() : value;
  const normalizedEpochMilliseconds = new Date(epochMilliseconds).getTime();
  return Number.isFinite(normalizedEpochMilliseconds) ? normalizedEpochMilliseconds : undefined;
}

export function TimestampValue({ value }: TimestampValueProps) {
  const epochMilliseconds = getEpochMilliseconds(value);
  if (epochMilliseconds === undefined) {
    return (
      <span data-typography="mono" {...stylex.props(timestampValueStyles.preview)}>
        Invalid timestamp
      </span>
    );
  }

  return (
    <time
      data-numeric-variant="tabular"
      data-typography="mono"
      dateTime={formatUtc(epochMilliseconds)}
      {...stylex.props(timestampValueStyles.preview)}
    >
      {localFormatter.format(epochMilliseconds)}
    </time>
  );
}
