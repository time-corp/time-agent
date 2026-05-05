import { useEffect, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { ControlledField } from "@/components/form/controlled-field"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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

type ProviderTypeComboboxProps = {
  value: ProviderFormValues["type"]
  disabled?: boolean
  invalid?: boolean
  onChange: (value: ProviderFormValues["type"]) => void
}

function ProviderTypeCombobox({
  value,
  disabled,
  invalid,
  onChange,
}: ProviderTypeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredOptions = providerTypeOptions.filter(
    (option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.value.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = providerTypeOptions.find((option) => option.value === value)
  const getFallback = (label: string) =>
    label
      .split("/")
      .flatMap((part) => part.trim().split(/\s+/))
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSearch("")
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            invalid && "border-destructive"
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedOption ? (
              <Avatar size="sm" className="size-5">
                <AvatarImage src={selectedOption.image} alt={selectedOption.label} />
                <AvatarFallback>{getFallback(selectedOption.label)}</AvatarFallback>
              </Avatar>
            ) : null}
            <span className="truncate">{selectedOption?.label ?? "Select provider type..."}</span>
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search provider type..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredOptions.length === 0 ? <CommandEmpty>No provider types found.</CommandEmpty> : null}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === option.value ? "opacity-100" : "opacity-0")}
                  />
                  <Avatar size="sm" className="size-5">
                    <AvatarImage src={option.image} alt={option.label} />
                    <AvatarFallback>{getFallback(option.label)}</AvatarFallback>
                  </Avatar>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
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
              <FieldLabel>Type</FieldLabel>
              <ProviderTypeCombobox
                value={field.value}
                disabled={pending}
                invalid={fieldState.invalid}
                onChange={field.onChange}
              />
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
