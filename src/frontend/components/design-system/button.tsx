import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004741] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg";

    const variantClasses = {
      primary:
        "bg-[#004741] text-white hover:bg-[#003B36] shadow-sm active:bg-[#002926]",
      secondary:
        "bg-[#F7F5F0] text-[#004741] hover:bg-[#E1EFEC] border border-[#D5D9D3] active:bg-[#C5DDD9]",
      outline:
        "border border-[#004741] bg-white text-[#004741] hover:bg-[#E1EFEC] active:bg-[#C5DDD9]",
      destructive:
        "bg-[#B94A48] text-white hover:bg-[#9E3C3A] active:bg-[#833230] shadow-sm",
      ghost:
        "text-[#5C6B68] hover:bg-[#F7F6F2] hover:text-[#004741]",
      link:
        "text-[#004741] underline-offset-4 hover:underline p-0 h-auto",
    }[variant];

    const sizeClasses = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
