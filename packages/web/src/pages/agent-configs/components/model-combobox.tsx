import { useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ProviderModelOption } from "@/hooks/useProviders"

type ModelComboboxProps = {
  value: string
  modelSource: "catalog" | "custom"
  options: ProviderModelOption[]
  disabled?: boolean
  invalid?: boolean
  onChange: (modelName: string, modelSource: "catalog" | "custom") => void
}

export function ModelCombobox({
  value,
  modelSource,
  options,
  disabled,
  invalid,
  onChange,
}: ModelComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const displayLabel =
    modelSource === "catalog"
      ? (options.find((o) => o.name === value)?.label ?? value)
      : value

  const handleSelect = (name: string) => {
    onChange(name, "catalog")
    setOpen(false)
    setSearch("")
  }

  const handleCustom = () => {
    onChange(search.trim(), "custom")
    setOpen(false)
    setSearch("")
  }

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase())
  )

  const showCustomOption = search.trim() && !options.some((o) => o.name === search.trim())

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <span className="truncate">
            {value ? displayLabel : "Select or type model name..."}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type model name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredOptions.length === 0 && !showCustomOption && (
              <CommandEmpty>No models found.</CommandEmpty>
            )}

            {filteredOptions.length > 0 && (
              <CommandGroup heading="Catalog models">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.name}
                    value={option.name}
                    onSelect={() => handleSelect(option.name)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value === option.name && modelSource === "catalog"
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{option.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showCustomOption && (
              <>
                {filteredOptions.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Custom">
                  <CommandItem value={search.trim()} onSelect={handleCustom}>
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value === search.trim() && modelSource === "custom"
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    Use &ldquo;{search.trim()}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
