import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, UsersIcon } from "lucide-react"

import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { useCreateUserMutation } from "@/hooks/useUsers"
import { UserForm } from "@/pages/users/components/user-form"
import {
  createUserSchema,
  type CreateUserValues,
} from "@/pages/users/schemas/user-schema"

export function UsersCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateUserMutation()

  const handleSubmit = async (
    values: CreateUserValues,
    action: "save" | "saveAndContinue"
  ) => {
    try {
      const user = await createMutation.mutateAsync({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        fullname: values.fullname.trim(),
      })
      if (action === "saveAndContinue") {
        void navigate({ to: "/users/$userId/edit", params: { userId: user.id } })
        return
      }
      void navigate({ to: "/users" })
    } catch {
      // mutation error handled upstream
    }
  }

  return (
    <>
      <PageHeaderCard
        icon={<UsersIcon />}
        title="New User"
        description="Create a new user account"
        headerRight={
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/users" })}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to users
          </Button>
        }
      />

      <SectionCard contentClassName="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Fill in the details below. The user can change their password after logging in.
        </p>
        <UserForm
          mode="create"
          pending={createMutation.isPending}
          schema={createUserSchema}
          showSaveAndContinue
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </>
  )
}
