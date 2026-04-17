import { createFileRoute } from "@tanstack/react-router";
import { UsersEditPage } from "@/pages/users/users-edit-page";

export const Route = createFileRoute("/users/$userId/edit")({
  component: function EditPage() {
    const { userId } = Route.useParams();
    return <UsersEditPage userId={userId} />;
  },
});
