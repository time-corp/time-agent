import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
import type { z } from "zod"
import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import type { AgentConfig } from "@/hooks/useAgentConfigs"
import type { AgentTeamFormValues } from "@/pages/agent-teams/schemas/agent-team-schema"

type AgentTeamFormProps = {
  mode: "create" | "update"
  schema: z.ZodTypeAny
  agents: AgentConfig[]
  initialValues?: Partial<AgentTeamFormValues>
  pending?: boolean
  onSubmit: (values: AgentTeamFormValues) => void
}

const emptyValues: AgentTeamFormValues = {
  name: "",
  description: "",
  leadAgentId: "",
  autoOrchestration: true,
  isActive: true,
  members: [],
}

export function AgentTeamForm({ mode, schema, agents, initialValues, pending = false, onSubmit }: AgentTeamFormProps) {
  const form = useForm<AgentTeamFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues: { ...emptyValues, ...initialValues },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "members" })
  const autoOrchestration = useWatch({ control: form.control, name: "autoOrchestration" })
  const leadAgentId = useWatch({ control: form.control, name: "leadAgentId" })
  const members = useWatch({ control: form.control, name: "members" })

  const agentMap = new Map(agents.map((a) => [a.id, a]))

  // Agents that can be added as members (exclude lead)
  const availableForMembers = agents.filter((a) => a.id !== leadAgentId)

  // Options for parent selector: null = direct to lead, or any other member in the form
  const parentOptions = (currentIndex: number) =>
    members
      .map((m, i) => ({ index: i, agentId: m.agentId }))
      .filter((m) => m.index !== currentIndex && m.agentId)

  return (
    <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <ControlledField name="name" control={form.control} label="Team Name" placeholder="Content Team" />
        <ControlledField name="description" control={form.control} label="Description" placeholder="Produces high-quality content" />

        <Controller
          name="leadAgentId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="team-lead-agent">Lead Agent</FieldLabel>
              <FieldDescription>
                The lead agent coordinates the team. Its system prompt should describe how to delegate tasks.
              </FieldDescription>
              <NativeSelect
                id="team-lead-agent"
                value={field.value}
                disabled={pending || agents.length === 0}
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  // reset any member that was the lead
                  const newLeadId = e.target.value
                  const updated = form.getValues("members").filter((m) => m.agentId !== newLeadId)
                  form.setValue("members", updated)
                }}
              >
                <option value="" disabled>
                  {agents.length === 0 ? "No agents available" : "Select lead agent"}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </NativeSelect>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="autoOrchestration"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Switch
                checked={field.value}
                disabled={pending}
                onCheckedChange={field.onChange}
              />
              <div className="flex flex-col gap-1">
                <FieldLabel>Auto Orchestration</FieldLabel>
                <FieldDescription>
                  When enabled, Mastra automatically routes each task to the most suitable team member.
                  When disabled, members execute in the order defined by their position.
                </FieldDescription>
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      {/* Members section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Team Members</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {autoOrchestration
                ? "Add agents to the team. The lead will delegate to them automatically."
                : "Define the execution order via position. Same position runs in parallel."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !leadAgentId}
            onClick={() => append({ agentId: "", parentAgentId: null, position: null })}
          >
            <PlusIcon data-icon="inline-start" />
            Add member
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No members yet. Add agents to the team.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    name={`members.${index}.agentId`}
                    control={form.control}
                    render={({ field: f, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Agent</FieldLabel>
                        <NativeSelect
                          value={f.value}
                          disabled={pending}
                          aria-invalid={fieldState.invalid}
                          onChange={(e) => f.onChange(e.target.value)}
                        >
                          <option value="" disabled>Select agent</option>
                          {availableForMembers.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </NativeSelect>
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`members.${index}.parentAgentId`}
                    control={form.control}
                    render={({ field: f }) => (
                      <Field>
                        <FieldLabel>Reports to</FieldLabel>
                        <NativeSelect
                          value={f.value ?? ""}
                          disabled={pending}
                          onChange={(e) => f.onChange(e.target.value || null)}
                        >
                          <option value="">Lead Agent (direct)</option>
                          {parentOptions(index).map((opt) => (
                            <option key={opt.agentId} value={opt.agentId}>
                              {agentMap.get(opt.agentId)?.name ?? opt.agentId}
                            </option>
                          ))}
                        </NativeSelect>
                      </Field>
                    )}
                  />
                </div>

                <div className="flex items-end justify-between gap-3">
                  {!autoOrchestration ? (
                    <Controller
                      name={`members.${index}.position`}
                      control={form.control}
                      render={({ field: f }) => (
                        <Field className="max-w-[120px]">
                          <FieldLabel>Position</FieldLabel>
                          <FieldDescription className="text-xs">Same position = parallel</FieldDescription>
                          <input
                            type="number"
                            min={1}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
                            value={f.value ?? ""}
                            disabled={pending}
                            onChange={(e) => f.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </Field>
                      )}
                    />
                  ) : (
                    <div />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={pending}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FieldGroup>
        <Controller
          name="isActive"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                checked={field.value ?? false}
                disabled={pending}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <div className="flex flex-col gap-1">
                <FieldLabel>Active</FieldLabel>
                <FieldDescription>Inactive teams are stored but not available for use.</FieldDescription>
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {mode === "create" ? "Create team" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
