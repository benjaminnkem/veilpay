'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  fieldClassName?: string;
  disabled?: boolean;
}

export function DatePickerField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder = 'Pick a date',
  fieldClassName,
  disabled,
}: DatePickerFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={fieldClassName}
    >
      {(field, { invalid }) => {
        const raw = field.value as unknown;
        const selected =
          raw instanceof Date
            ? raw
            : typeof raw === 'string' || typeof raw === 'number'
              ? new Date(raw)
              : undefined;

        return (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  id={name}
                  aria-invalid={invalid || undefined}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selected && 'text-muted-foreground',
                  )}
                />
              }
            >
              <CalendarIcon className="size-4" />
              {selected ? format(selected, 'PPP') : placeholder}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={(date) => field.onChange(date ?? null)}
              />
            </PopoverContent>
          </Popover>
        );
      }}
    </FormField>
  );
}
