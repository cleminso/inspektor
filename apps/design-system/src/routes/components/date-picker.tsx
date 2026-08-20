import { createFileRoute } from "@tanstack/react-router";

import { DatePickerPage } from "@/components/content/components/datePicker/page";

export const Route = createFileRoute("/components/date-picker")({
  component: DatePickerPage,
  head: () => ({ meta: [{ title: "DatePicker · Inspector Design System" }] }),
});
