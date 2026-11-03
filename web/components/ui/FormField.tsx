import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}) => {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {error ? (
        <div className="form-error">{error}</div>
      ) : hint ? (
        <div className="form-hint">{hint}</div>
      ) : null}
    </div>
  );
};

