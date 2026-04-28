import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import type { Provider } from "@/hooks/useProviders"
import type { ModelFormValues } from "@/pages/models/schemas/model-schema"

type ModelFormProps = {
  mode: "create" | "update"
  schema: z.ZodTypeAny
  providers: Provider[]
  initialValues?: Partial<ModelFormValues>
  pending?: boolean
  showSaveAndContinue?: boolean
  onSubmit: (values: ModelFormValues, action: "save" | "saveAndContinue") => void
}

const emptyValues: ModelFormValues = {
  providerId: "",
  modelName: "",
  temperature: 0.7,
  maxTokens: 4096,
  isActive: true,
}

export function ModelForm({
  mode,
  schema,
  providers,
  initialValues,
  pending = false,
  showSaveAndContinue = false,
  onSubmit,
}: ModelFormProps) {
  const form = useForm<ModelFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues: { ...emptyValues, ...initialValues },
  })

  useEffect(() => {
    const nextValues = { ...emptyValues, ...initialValues }
    if (!nextValues.providerId && providers[0]?.id) {
      nextValues.providerId = providers[0].id
    }
    form.reset(nextValues)
  }, [form, initialValues, providers])

  const handleSave = form.handleSubmit((values) => onSubmit(values, "save"))
  const handleSaveAndContinue = form.handleSubmit((values) => onSubmit(values, "saveAndContinue"))

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSave}>
      <FieldGroup>
        <Controller
          name="providerId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="model-provider-id">Provider</FieldLabel>
              <NativeSelect
                id="model-provider-id"
                value={field.value}
                disabled={pending || providers.length === 0}
                aria-invalid={fieldState.invalid}
                onChange={(event) => field.onChange(event.target.value)}
              >
                <option value="" disabled>
                  {providers.length === 0 ? "No providers available" : "Select provider"}
                </option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.type})
                  </option>
                ))}
              </NativeSelect>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <ControlledField name="modelName" control={form.control} label="Model Name" placeholder="gpt-4o-mini" />

        <div className="grid gap-5 md:grid-cols-2">
          <ControlledField
            name="temperature"
            control={form.control}
            label="Temperature"
            type="number"
            placeholder="0.7"
            description="Value between 0 and 2."
          />
          <ControlledField
            name="maxTokens"
            control={form.control}
            label="Max Tokens"
            type="number"
            placeholder="4096"
            description="Maximum token budget for generations."
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
                <FieldDescription>Inactive models stay in the catalog but should not be assigned to new agents.</FieldDescription>
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
        <Button type="submit" disabled={pending || providers.length === 0}>
          {mode === "create" ? "Create model" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
