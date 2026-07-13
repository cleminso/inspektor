import { createFileRoute } from "@tanstack/react-router";

import { FormPage } from "@/components/content/components/form/page";

export const Route = createFileRoute("/components/form")({
  component: FormPage,
  head: () => ({
    meta: [{ title: "Form · Inspector Design System" }],
  }),
});
