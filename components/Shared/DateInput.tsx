import React from 'react';
import { X } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';

interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  className = '',
  placeholder
}) => {
  // Use CustomDatePicker for better mobile compatibility
  return (
    <CustomDatePicker
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      className={className}
      placeholder={placeholder}
    />
  );
};