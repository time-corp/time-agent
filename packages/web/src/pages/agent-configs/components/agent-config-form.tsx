import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import type { Model } from "@/hooks/useModels"
import type { AgentConfigFormValues } from "@/pages/agent-configs/schemas/agent-config-schema"

type AgentConfigFormProps = {
  mode: "create" | "update"
  schema: z.ZodTypeAny
  models: Model[]
  initialValues?: Partial<AgentConfigFormValues>
  pending?: boolean
  showSaveAndContinue?: boolean
  onSubmit: (values: AgentConfigFormValues, action: "save" | "saveAndContinue") => void
}

const emptyValues: AgentConfigFormValues = {
  name: "",
  description: "",
  modelId: "",
  systemPrompt: "",
  toolsConfig: "{}",
  memoryConfig: "{}",
  isActive: true,
}

export function AgentConfigForm({
  mode,
  schema,
  models,
  initialValues,
  pending = false,
  showSaveAndContinue = false,
  onSubmit,
}: AgentConfigFormProps) {
  const form = useForm<AgentConfigFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues: { ...emptyValues, ...initialValues },
  })

  useEffect(() => {
    const nextValues = { ...emptyValues, ...initialValues }
    if (!nextValues.modelId && models[0]?.id) {
      nextValues.modelId = models[0].id
    }
    form.reset(nextValues)
  }, [form, initialValues, models])

  const handleSave = form.handleSubmit((values) => onSubmit(values, "save"))
  const handleSaveAndContinue = form.handleSubmit((values) => onSubmit(values, "saveAndContinue"))

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSave}>
      <FieldGroup>
        <ControlledField name="name" control={form.control} label="Name" placeholder="Writer Agent" />
        <ControlledField
          name="description"
          control={form.control}
          label="Description"
          placeholder="Writes long-form content"
        />

        <Controller
          name="modelId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="agent-model-id">Model</FieldLabel>
              <NativeSelect
                id="agent-model-id"
                value={field.value}
                disabled={pending || models.length === 0}
                aria-invalid={fieldState.invalid}
                onChange={(event) => field.onChange(event.target.value)}
              >
                <option value="" disabled>
                  {models.length === 0 ? "No models available" : "Select model"}
                </option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName}
                  </option>
                ))}
              </NativeSelect>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <ControlledField
          name="systemPrompt"
          control={form.control}
          label="System Prompt"
          placeholder="You are a helpful specialist..."
          multiline
          rows={10}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <ControlledField
            name="toolsConfig"
            control={form.control}
            label="Tools Config"
            placeholder='{"enabledTools":["search"]}'
            description="Must be a valid JSON object."
            multiline
            rows={8}
          />
          <ControlledField
            name="memoryConfig"
            control={form.control}
            label="Memory Config"
            placeholder='{"mode":"thread"}'
            description="Must be a valid JSON object."
            multiline
            rows={8}
          />
        </div>

        <Controller
          name="isActive"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox checked={field.value ?? false} disabled={pending} onCheckedChange={(checked) => field.onChange(checked === true)} />
              <div className="flex flex-col gap-1">
                <FieldLabel>Active</FieldLabel>
                <FieldDescription>Inactive agent configs stay stored but should not be exposed for runtime selection.</FieldDescription>
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-wrap justify-end gap-3">
        {showSaveAndContinue ? (
          <Button type="button" variant="outline" disabled={pending} onClick={() => void handleSaveAndContinue()}>
            Save & continue editing
          </Button>
        ) : null}
        <Button type="submit" disabled={pending || models.length === 0}>
          {mode === "create" ? "Create agent config" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
