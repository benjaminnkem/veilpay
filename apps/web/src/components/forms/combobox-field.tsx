'use client';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useState } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import type { SelectOption } from '@/components/forms/select-field';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  options: SelectOption[];
  fieldClassName?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}

export function ComboboxField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
  options,
  fieldClassName,
  disabled,
  allowCustom = true,
}: ComboboxFieldProps<TFieldValues, TName>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={fieldClassName}
    >
      {(field, { invalid }) => {
        const selected = options.find((option) => option.value === field.value);
        const display =
          selected?.label ??
          (typeof field.value === 'string' && field.value
            ? field.value
            : null);

        const normalizedQuery = query.trim();
        const hasExactMatch = options.some(
          (option) =>
            option.label.toLowerCase() === normalizedQuery.toLowerCase() ||
            option.value.toLowerCase() === normalizedQuery.toLowerCase()
        );
        const showCustom =
          allowCustom &&
          normalizedQuery.length > 0 &&
          !hasExactMatch;

        return (
          <Popover
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setQuery('');
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={invalid || undefined}
                  id={name}
                  disabled={disabled}
                  className={cn(
                    'h-9 w-full justify-between px-2.5 font-normal',
                    !display && 'text-muted-foreground'
                  )}
                />
              }
            >
              <span className="truncate">{display ?? placeholder}</span>
              <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent
              className="w-(--anchor-width) min-w-[var(--anchor-width)] p-0"
              align="start"
              sideOffset={4}
            >
              <Command shouldFilter>
                <CommandInput
                  placeholder={searchPlaceholder}
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        disabled={option.disabled}
                        data-checked={field.value === option.value || undefined}
                        onSelect={() => {
                          field.onChange(option.value);
                          setOpen(false);
                          setQuery('');
                        }}
                      >
                        <span className="truncate">{option.label}</span>
                        <CheckIcon
                          className={cn(
                            'ml-auto size-4 shrink-0',
                            field.value === option.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                    {showCustom ? (
                      <CommandItem
                        value={normalizedQuery}
                        onSelect={() => {
                          field.onChange(normalizedQuery);
                          setOpen(false);
                          setQuery('');
                        }}
                      >
                        Use “{normalizedQuery}”
                      </CommandItem>
                    ) : null}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }}
    </FormField>
  );
}
