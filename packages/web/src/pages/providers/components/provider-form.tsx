import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect } from "@/components/ui/native-select"
import { providerTypeOptions, type ProviderFormValues } from "@/pages/providers/schemas/provider-schema"

type ProviderFormProps = {
  mode: "create" | "update"
  initialValues?: Partial<ProviderFormValues>
  pending?: boolean
  schema: z.ZodTypeAny
  showSaveAndContinue?: boolean
  onSubmit: (values: ProviderFormValues, action: "save" | "saveAndContinue") => void
}

const emptyValues: ProviderFormValues = {
  name: "",
  type: "openai",
  apiKey: "",
  baseUrl: "",
  isActive: true,
}

export function ProviderForm({
  mode,
  initialValues,
  pending = false,
  schema,
  showSaveAndContinue = false,
  onSubmit,
}: ProviderFormProps) {
  const form = useForm<ProviderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues: { ...emptyValues, ...initialValues },
  })

  useEffect(() => {
    form.reset({ ...emptyValues, ...initialValues })
  }, [form, initialValues])

  const handleSave = form.handleSubmit((values) => onSubmit(values, "save"))
  const handleSaveAndContinue = form.handleSubmit((values) => onSubmit(values, "saveAndContinue"))

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSave}>
      <FieldGroup>
        <ControlledField name="name" control={form.control} label="Name" placeholder="Primary OpenAI" />

        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="provider-type">Type</FieldLabel>
              <NativeSelect
                id="provider-type"
                value={field.value}
                disabled={pending}
                aria-invalid={fieldState.invalid}
                onChange={(event) => field.onChange(event.target.value)}
              >
                {providerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <ControlledField
          name="apiKey"
          control={form.control}
          label="API Key"
          type="password"
          placeholder={mode === "create" ? "sk-..." : "Leave blank to keep current key"}
          description={
            mode === "update"
              ? "Leave blank if you do not want to change the stored key."
              : "The API key is stored on the backend and never shown again."
          }
        />

        <ControlledField
          name="baseUrl"
          control={form.control}
          label="Base URL"
          placeholder="http://localhost:11434/v1"
          description="Optional for OpenAI/Anthropic, useful for Ollama, Azure, and OpenAI-compatible providers."
        />

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
                <FieldDescription>Inactive providers remain in the catalog but cannot be selected.</FieldDescription>
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
        <Button type="submit" disabled={pending}>
          {mode === "create" ? "Create provider" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
