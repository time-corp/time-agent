import { createFileRoute } from "@tanstack/react-router";
import { RealtimePage } from "../pages/realtime-page";

export const Route = createFileRoute("/realtime")({
  component: RealtimePage,
});
