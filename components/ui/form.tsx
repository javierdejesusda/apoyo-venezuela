import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-xl border border-border-strong bg-surface text-ink shadow-sm ' +
  'placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] duration-150 ' +
  'focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    // text-base (16px) prevents iOS zoom-on-focus.
    return <input ref={ref} className={cn(CONTROL, 'h-11 px-3.5 text-base', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(CONTROL, 'min-h-24 px-3.5 py-2.5 text-base', className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(CONTROL, 'h-11 appearance-none pl-3.5 pr-10 text-base', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
      </div>
    );
  },
);

export function Label({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('block text-sm font-medium text-ink', className)} {...props}>
      {children}
    </label>
  );
}

interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-danger"> *</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
