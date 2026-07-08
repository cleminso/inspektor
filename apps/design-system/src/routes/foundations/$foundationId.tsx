import { createFileRoute } from "@tanstack/react-router";

import { FundationPage } from "@/fundations/page";

export const Route = createFileRoute("/foundations/$foundationId")({
  component: FundationPage,
});
