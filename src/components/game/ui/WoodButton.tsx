"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export type WoodButtonVariant =
  | "default"
  | "primary"
  | "danger"
  | "secondary";

type WoodButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WoodButtonVariant;
};

export function woodButtonClassName(
  variant: WoodButtonVariant = "default",
  className?: string,
) {
  return cn(
    "kepi-wood-btn inline-flex items-center justify-center gap-1.5 font-medium",
    variant === "primary" && "kepi-wood-btn-primary",
    variant === "danger" && "kepi-wood-btn-danger",
    variant === "secondary" && "kepi-wood-btn-secondary",
    className,
  );
}

export function WoodButton({
  className,
  variant = "default",
  type = "button",
  children,
  ...props
}: WoodButtonProps) {
  return (
    <button type={type} className={woodButtonClassName(variant, className)} {...props}>
      {children}
    </button>
  );
}
