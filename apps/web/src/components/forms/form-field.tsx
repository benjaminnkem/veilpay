'use client';

import type { ReactNode } from 'react';
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from 'react-hook-form';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  className?: string;
  children: (
    field: ControllerRenderProps<TFieldValues, TName>,
    meta: { invalid: boolean; errorMessage?: string },
  ) => ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  className,
  children,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={undefined as PathValue<TFieldValues, TName>}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid || undefined}
          className={className}
        >
          {label ? <FieldLabel htmlFor={name}>{label}</FieldLabel> : null}
          {children(field, {
            invalid: fieldState.invalid,
            errorMessage: fieldState.error?.message,
          })}
          {description ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
          {fieldState.error?.message ? (
            <FieldError>{fieldState.error.message}</FieldError>
          ) : null}
        </Field>
      )}
    />
  );
}
