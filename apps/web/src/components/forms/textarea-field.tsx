'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Textarea } from '@/components/ui/textarea';

interface TextareaFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<typeof Textarea>, 'name' | 'defaultValue'> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  fieldClassName?: string;
}

export function TextareaField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  fieldClassName,
  id,
  ...textareaProps
}: TextareaFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={fieldClassName}
    >
      {(field, { invalid }) => (
        <Textarea
          id={id ?? name}
          aria-invalid={invalid || undefined}
          {...textareaProps}
          {...field}
          value={field.value ?? ''}
        />
      )}
    </FormField>
  );
}
