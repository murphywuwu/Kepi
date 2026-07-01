"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type KepiToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
};

export function KepiToggle({
  checked,
  onCheckedChange,
  label,
  className,
  disabled,
  ...props
}: KepiToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn("kepi-toggle", checked && "kepi-toggle--on", className)}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span className="kepi-toggle-thumb" aria-hidden />
    </button>
  );
}
