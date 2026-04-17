import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"

import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { CreateUserValues } from "@/pages/users/user-schema"

type UserFormProps = {
  mode: "create" | "update"
  initialValues?: Partial<CreateUserValues>
  readOnlyEmail?: string
  pending?: boolean
  schema: z.ZodTypeAny
  showSaveAndContinue?: boolean
  onSubmit: (values: CreateUserValues, action: "save" | "saveAndContinue") => void
}

const emptyValues: CreateUserValues = {
  username: "",
  email: "",
  password: "",
  fullname: "",
}

export function UserForm({
  mode,
  initialValues,
  readOnlyEmail,
  pending = false,
  schema,
  showSaveAndContinue = false,
  onSubmit,
}: UserFormProps) {
  const form = useForm<CreateUserValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues: { ...emptyValues, ...initialValues },
  })

  useEffect(() => {
    form.reset({ ...emptyValues, ...initialValues })
  }, [form, initialValues])

  const handleSave = form.handleSubmit((values) => onSubmit(values, "save"))
  const handleSaveAndContinue = form.handleSubmit((values) =>
    onSubmit(values, "saveAndContinue")
  )

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSave}>
      <FieldGroup>
        {mode === "create" ? (
          <>
            <ControlledField
              name="email"
              control={form.control}
              label="Email"
              type="email"
              placeholder="user@example.com"
            />
            <ControlledField
              name="password"
              control={form.control}
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              description="Used for login. Must be at least 6 characters."
            />
          </>
        ) : (
          <Field>
            <FieldLabel htmlFor="read-only-email">Email</FieldLabel>
            <Input
              id="read-only-email"
              type="email"
              disabled
              value={readOnlyEmail ?? ""}
            />
          </Field>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <ControlledField
            name="username"
            control={form.control}
            label="Username"
            placeholder="johndoe"
          />
          <ControlledField
            name="fullname"
            control={form.control}
            label="Full Name"
            placeholder="John Doe"
          />
        </div>
      </FieldGroup>

      <div className="flex flex-wrap justify-end gap-3">
        {showSaveAndContinue && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void handleSaveAndContinue()}
          >
            Save & continue editing
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {mode === "create" ? "Create user" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
