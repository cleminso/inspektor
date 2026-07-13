import { createFileRoute } from "@tanstack/react-router";
import { ComboboxPage } from "@/components/content/components/combobox/page";

export const Route = createFileRoute("/components/combobox")({
  component: ComboboxPage,
  head: () => ({ meta: [{ title: "Combobox · Inspector Design System" }] }),
});
