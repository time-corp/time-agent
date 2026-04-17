import { createFileRoute } from "@tanstack/react-router";
import { UsersCreatePage } from "@/pages/users/users-create-page";

export const Route = createFileRoute("/users/create")({
  component: UsersCreatePage,
});
