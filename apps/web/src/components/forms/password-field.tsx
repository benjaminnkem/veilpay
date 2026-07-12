'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasswordFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<
    React.ComponentProps<typeof Input>,
    'name' | 'type' | 'defaultValue'
  > {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  fieldClassName?: string;
}

export function PasswordField<
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
}: PasswordFieldProps<TFieldValues, TName>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={fieldClassName}
    >
      {(field, { invalid }) => (
        <div className="relative">
          <Input
            id={id ?? name}
            type={visible ? 'text' : 'password'}
            autoComplete={inputProps.autoComplete ?? 'current-password'}
            aria-invalid={invalid || undefined}
            className="pr-10"
            {...inputProps}
            {...field}
            value={field.value ?? ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
      )}
    </FormField>
  );
}
