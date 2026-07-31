import { Button, Toaster, toasts, type ToastOptions, type ToastStatus } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { toastItem } from "@/lib/registry";

type ToastPlaygroundStatus = Exclude<ToastStatus, "loading">;

export interface ToastPlaygroundState {
  status: ToastPlaygroundStatus;
  description: boolean;
  preserve: boolean;
  undo: boolean;
  [key: string]: boolean | string;
}

const initialState: ToastPlaygroundState = {
  status: "message",
  description: false,
  preserve: false,
  undo: false,
};

const controls = [
  {
    kind: "select",
    key: "status",
    label: "Status",
    options: ["message", "success", "warning", "error"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "description", label: "Description" },
  { kind: "boolean", key: "preserve", label: "Preserve" },
  { kind: "boolean", key: "undo", label: "Undo action" },
] as const satisfies readonly PlaygroundControl<ToastPlaygroundState>[];

const contentByStatus = {
  message: "Row inserted",
  success: "Connection saved",
  warning: "Schema changed",
  error: "Could not insert row",
} satisfies Record<ToastPlaygroundStatus, string>;

export function serializeToastPlayground(state: ToastPlaygroundState): string {
  const options = [
    state.description === true ? 'description: "Additional context for this notification"' : null,
    state.preserve === true ? "preserve: true" : null,
    state.undo === true ? "undo: () => undefined" : null,
  ].filter((option): option is string => option !== null);
  const invocation =
    options.length === 0
      ? `toasts.${state.status}("${contentByStatus[state.status]}")`
      : `toasts.${state.status}("${contentByStatus[state.status]}", {\n          ${options.join(",\n          ")}\n        })`;

  return createPlaygroundSource({
    imports: { Button: true, Toaster: true, toasts: true },
    example: `(\n    <>\n      <Button variant="secondary" onClick={() => ${invocation}}>\n        Show toast\n      </Button>\n      <Toaster />\n    </>\n  )`,
  });
}

export function ToastPlayground({
  children,
  withToaster = true,
}: {
  children?: ReactNode;
  withToaster?: boolean;
}): ReactElement {
  const [state, setState] = useState<ToastPlaygroundState>(initialState);

  const showToast = (): void => {
    const options: ToastOptions = {
      description:
        state.description === true ? "Additional context for this notification" : undefined,
      preserve: state.preserve,
      undo: state.undo === true ? () => undefined : undefined,
    };
    toasts[state.status](contentByStatus[state.status], options);
  };

  const preview = (
    <>
      <Button variant="secondary" onClick={showToast}>
        Show toast
      </Button>
      {withToaster === true ? <Toaster /> : null}
    </>
  );

  return (
    <ComponentDocsPage
      title={toastItem.title}
      description={toastItem.description}
      source={toastItem.source}
      preview={preview}
      sourceCode={serializeToastPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
          onReset={() => setState(initialState)}
        />
      }
    >
      {children}
    </ComponentDocsPage>
  );
}
