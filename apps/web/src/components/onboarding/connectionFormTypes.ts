import {
  DEFAULT_BRANCH_NAME,
  DEFAULT_SERVER_URL,
  type ConnectionDraft,
} from "@/lib/config/connections";
import type { PrefillConfig } from "@/lib/config/prefill";

export interface AddConnectionFormValues extends ConnectionDraft {
  branch: string;
}

export type AddConnectionStep = "form" | "schema";

export function createInitialFormValues(prefill: PrefillConfig | null): AddConnectionFormValues {
  return {
    name: prefill?.name ?? "",
    serverUrl: prefill?.serverUrl ?? DEFAULT_SERVER_URL,
    appId: prefill?.appId ?? "",
    adminSecret: prefill?.adminSecret ?? "",
    env: prefill?.env ?? "dev",
    branch: prefill?.branch ?? DEFAULT_BRANCH_NAME,
  };
}

export function getPrefillKey(prefill: PrefillConfig | null): string {
  if (prefill === null) {
    return "empty";
  }

  return JSON.stringify([
    prefill.name,
    prefill.serverUrl,
    prefill.appId,
    prefill.adminSecret,
    prefill.env,
    prefill.branch,
  ]);
}
