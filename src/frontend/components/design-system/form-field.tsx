import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold text-[#102A27]">
        {label}
        {required && <span className="ml-1 text-[#B94A48]">*</span>}
      </label>
      {description && (
        <p className="text-[11px] text-[#5C6B68]">{description}</p>
      )}
      {children}
      {error && <p className="text-xs text-[#B94A48] font-medium">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border border-[#D5D9D3] bg-white px-3 py-1.5 text-sm text-[#102A27] transition-colors placeholder:text-[#899491] focus-visible:border-[#004741] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#004741] disabled:cursor-not-allowed disabled:bg-[#F7F6F2] disabled:text-[#899491]",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border border-[#D5D9D3] bg-white px-3 py-1.5 text-sm text-[#102A27] transition-colors focus-visible:border-[#004741] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#004741] disabled:cursor-not-allowed disabled:bg-[#F7F6F2] disabled:text-[#899491]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-[#D5D9D3] bg-white px-3 py-2 text-sm text-[#102A27] transition-colors placeholder:text-[#899491] focus-visible:border-[#004741] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#004741] disabled:cursor-not-allowed disabled:bg-[#F7F6F2] disabled:text-[#899491]",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
