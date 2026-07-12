'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';

interface InputFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<typeof Input>, 'name' | 'defaultValue'> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  fieldClassName?: string;
}

export function InputField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  fieldClassName,
  id,
  ...inputProps
}: InputFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={fieldClassName}
    >
      {(field, { invalid }) => (
        <Input
          id={id ?? name}
          aria-invalid={invalid || undefined}
          {...inputProps}
          {...field}
          value={field.value ?? ''}
        />
      )}
    </FormField>
  );
}
