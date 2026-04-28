"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { PrefixTrie } from "@/lib/prefix-trie"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
  disabled?: boolean
}

export type ComboboxSearchMode = "cmdk" | "prefix"

export type ComboboxProps = {
  options: ComboboxOption[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  contentClassName?: string

  /**
   * Search behavior:
   * - "cmdk" (default): filtering handled by cmdk internally.
   * - "prefix": prefix-only filtering using an in-memory trie.
   */
  searchMode?: ComboboxSearchMode

  /**
   * Used when searchMode="prefix".
   * For team-number search, pass (o) => o.label or (o) => o.value (whichever contains the team number).
   */
  getSearchKey?: (option: ComboboxOption) => string

  /** Used when searchMode="prefix" to control case sensitivity. */
  caseSensitiveSearch?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  buttonClassName,
  contentClassName,
  searchMode = "cmdk",
  getSearchKey,
  caseSensitiveSearch = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const normalizedQuery = React.useMemo(() => {
    if (searchMode !== "prefix") return query
    // Pit-scouting/team-number optimized: digits only.
    return query.replace(/\D/g, "")
  }, [query, searchMode])

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  )

  const handleSelect = (nextValue: string) => {
    // Toggle off if selecting the same value
    const next = nextValue === value ? null : nextValue
    onValueChange(next)
    setOpen(false)
  }

  const trieIndex = React.useMemo(() => {
    if (searchMode !== "prefix") return null

    const trie = new PrefixTrie({ caseSensitive: caseSensitiveSearch })

    const digitsOnly = (input: string) => input.replace(/\D/g, "")

    // Default to digits-only label search (team number). If callers pass getSearchKey,
    // we still digits-normalize it to match digits-only query behavior.
    const rawKeyFn = getSearchKey ?? ((o: ComboboxOption) => o.label)
    const keyFn = (o: ComboboxOption) => digitsOnly(rawKeyFn(o))

    for (const option of options) {
      const k = keyFn(option)
      // If a key has no digits (unlikely for teams), fall back to value digits.
      trie.insert(k || digitsOnly(option.value), option.value)
    }

    return trie
  }, [caseSensitiveSearch, getSearchKey, options, searchMode])

  const filteredOptions = React.useMemo(() => {
    if (searchMode !== "prefix") return options
    if (!trieIndex) return options
    // Empty query => show all
    if (!normalizedQuery) return options

    const idSet = trieIndex.searchPrefix(normalizedQuery)
    if (idSet.size === 0) return []

    // preserve original order
    return options.filter((o) => idSet.has(o.value))
  }, [normalizedQuery, options, searchMode, trieIndex])

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select an option"
            disabled={disabled}
            className={cn("w-full justify-between", buttonClassName)}
          >
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "w-[--radix-popover-trigger-width] p-0",
            contentClassName
          )}
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {(searchMode === "prefix" ? filteredOptions : options).map(
                  (option) => (
                    <CommandItem
                      key={option.value}
                      // cmdk uses this for matching; harmless (and can still be useful) in prefix mode
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          option.value === value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
