"use client";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Search } from "lucide-react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-surface-border bg-white px-4 text-sm text-ink",
        "placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/25 focus:border-accent-blue/50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search size={16} className="text-text-muted" strokeWidth={1.75} />
      </div>
      <input
        className={cn(
          "h-11 w-full rounded-full border border-surface-border bg-white pl-11 pr-4 text-sm text-ink leading-none shadow-soft",
          "placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/25 focus:border-accent-blue/50",
        )}
        {...props}
      />
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 rounded-xl border border-surface-border bg-white px-4 text-sm text-ink min-w-[140px]",
        "focus:outline-none focus:ring-2 focus:ring-accent-blue/25 focus:border-accent-blue/50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
