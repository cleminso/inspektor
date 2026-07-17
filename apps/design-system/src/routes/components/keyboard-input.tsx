import { createFileRoute } from "@tanstack/react-router";

import { KeyboardInputPage } from "@/components/content/components/keyboardInput/page";

export const Route = createFileRoute("/components/keyboard-input")({
  component: KeyboardInputPage,
  head: () => ({ meta: [{ title: "Keyboard Input · Inspector Design System" }] }),
});
