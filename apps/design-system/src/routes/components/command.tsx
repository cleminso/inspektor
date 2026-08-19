import { createFileRoute } from "@tanstack/react-router";
import { CommandPage } from "@/components/content/components/command/page";
export const Route = createFileRoute("/components/command")({ component: CommandPage, head: () => ({ meta: [{ title: "Command · Inspector Design System" }] }) });
