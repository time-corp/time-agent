import { useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon, UsersIcon } from "lucide-react"

import { PageHeaderCard } from "@/components/share/cards/page-header-card"
import { SectionCard } from "@/components/share/cards/section-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetUserQuery, useUpdateUserMutation } from "@/hooks/useUsers"
import { UserForm } from "@/pages/users/user-form"
import { updateUserSchema, type CreateUserValues } from "@/pages/users/user-schema"

type UsersEditPageProps = {
  userId: string
}

export function UsersEditPage({ userId }: UsersEditPageProps) {
  const navigate = useNavigate()
  const { data: user, isLoading, isError } = useGetUserQuery(userId)
  const updateMutation = useUpdateUserMutation()

  const handleSubmit = async (values: CreateUserValues) => {
    try {
      await updateMutation.mutateAsync({
        id: userId,
        payload: {
          username: values.username.trim(),
          fullname: values.fullname.trim(),
        },
      })
      void navigate({ to: "/users" })
    } catch {
      // mutation error handled upstream
    }
  }

  return (
    <>
      <PageHeaderCard
        icon={<UsersIcon />}
        title="Edit User"
        description="Update user account details"
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

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : isError || !user ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load user.
        </div>
      ) : (
        <SectionCard>
          <UserForm
            mode="update"
            initialValues={{
              username: user.username,
              fullname: user.fullname,
              email: user.email,
            }}
            readOnlyEmail={user.email}
            pending={updateMutation.isPending}
            schema={updateUserSchema}
            onSubmit={handleSubmit}
          />
        </SectionCard>
      )}
    </>
  )
}
