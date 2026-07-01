"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, InputHTMLAttributes } from "react";

type KepiSliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  value: number;
  min?: number;
  max?: number;
  showValue?: boolean;
  valueLabel?: (value: number) => string;
};

export function KepiSlider({
  value,
  min = 0,
  max = 100,
  showValue = true,
  valueLabel,
  className,
  style,
  ...props
}: KepiSliderProps) {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const display = valueLabel ? valueLabel(value) : String(value);

  return (
    <div className={cn("kepi-slider-wrap", className)}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="kepi-slider"
        style={
          {
            ...style,
            "--kepi-slider-fill": `${percent}%`,
          } as CSSProperties
        }
        {...props}
      />
      {showValue ? (
        <span className="kepi-slider-value" aria-hidden>
          {display}
        </span>
      ) : null}
    </div>
  );
}
