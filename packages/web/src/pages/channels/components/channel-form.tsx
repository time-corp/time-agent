import { useEffect, useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import type { AgentConfig } from "@/hooks/useAgentConfigs"
import type { AgentTeam } from "@/hooks/useAgentTeams"
import {
  channelTypeValues,
  channelTypeMeta,
  credentialFields,
  type ChannelFormValues,
  type ChannelTypeValue,
} from "@/pages/channels/schemas/channel-schema"

type ChannelFormProps = {
  mode: "create" | "update"
  agents: AgentConfig[]
  teams: AgentTeam[]
  initialValues?: Partial<ChannelFormValues> | undefined
  pending?: boolean
  showSaveAndContinue?: boolean
  onSubmit: (values: ChannelFormValues, action: "save" | "saveAndContinue") => void
}

const emptyValues: ChannelFormValues = {
  name: "",
  type: "telegram",
  targetType: "none",
  agentId: null,
  teamId: null,
  credentials: {},
  options: {},
  isActive: true,
}

export function ChannelForm({
  mode,
  agents,
  teams,
  initialValues,
  pending = false,
  showSaveAndContinue = false,
  onSubmit,
}: ChannelFormProps) {
  const form = useForm<ChannelFormValues>({
    defaultValues: { ...emptyValues, ...initialValues },
  })

  useEffect(() => {
    form.reset({ ...emptyValues, ...initialValues })
  }, [form, initialValues])

  const channelType = useWatch({ control: form.control, name: "type" }) as ChannelTypeValue
  const targetType = useWatch({ control: form.control, name: "targetType" })

  const fields = credentialFields[channelType] ?? []

  const handleSave = form.handleSubmit((values) => onSubmit(values, "save"))
  const handleSaveAndContinue = form.handleSubmit((values) =>
    onSubmit(values, "saveAndContinue"),
  )

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSave}>
      <FieldGroup>
        <ControlledField name="name" control={form.control} label="Name" placeholder="My Telegram Bot" />

        {/* Channel type */}
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="channel-type">Channel Type</FieldLabel>
              <NativeSelect
                id="channel-type"
                value={field.value}
                disabled={pending || mode === "update"}
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  form.setValue("credentials", {})
                }}
              >
                {channelTypeValues.map((t) => (
                  <option key={t} value={t}>
                    {channelTypeMeta[t].label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError />
            </Field>
          )}
        />

        {/* Target: agent or team */}
        <Field>
          <FieldLabel>Target <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Controller
                name="targetType"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant={field.value === "none" ? "secondary" : "outline"}
                      onClick={() => {
                        field.onChange("none")
                        form.setValue("agentId", null)
                        form.setValue("teamId", null)
                      }}
                    >
                      None
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={field.value === "agent" ? "secondary" : "outline"}
                      onClick={() => {
                        field.onChange("agent")
                        form.setValue("teamId", null)
                      }}
                    >
                      Agent
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={field.value === "team" ? "secondary" : "outline"}
                      onClick={() => {
                        field.onChange("team")
                        form.setValue("agentId", null)
                      }}
                    >
                      Team
                    </Button>
                  </>
                )}
              />
            </div>

            {targetType === "agent" && (
              <Controller
                name="agentId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <NativeSelect
                      value={field.value ?? ""}
                      disabled={pending || agents.length === 0}
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <option value="">
                        {agents.length === 0 ? "No agents available" : "Select agent"}
                      </option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldError />
                  </Field>
                )}
              />
            )}
            {targetType === "team" && (
              <Controller
                name="teamId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <NativeSelect
                      value={field.value ?? ""}
                      disabled={pending || teams.length === 0}
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <option value="">
                        {teams.length === 0 ? "No teams available" : "Select team"}
                      </option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldError />
                  </Field>
                )}
              />
            )}
          </div>
        </Field>
      </FieldGroup>

      {/* Credentials */}
      {fields.length > 0 && (
        <FieldGroup>
          <p className="text-sm font-medium">Credentials</p>
          {fields.map((f) => (
            <Controller
              key={f.key}
              name={`credentials.${f.key}` as `credentials.${string}`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    type="password"
                    placeholder={f.placeholder}
                    disabled={pending}
                    value={(field.value as string) ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  <FieldError />
                </Field>
              )}
            />
          ))}
        </FieldGroup>
      )}

      {/* Options */}
      <FieldGroup>
        <p className="text-sm font-medium">Options</p>
        <ControlledField
          name="options.welcomeMessage"
          control={form.control}
          label="Welcome Message"
          placeholder="Hello! How can I help you?"
        />
        <Controller
          name="isActive"
          control={form.control}
          render={({ field }) => (
            <Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="channel-is-active"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={pending}
                />
                <FieldLabel htmlFor="channel-is-active">Active</FieldLabel>
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
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
      </div>
    </form>
  )
}
