import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

export function Slider({
  className,
  min = 0,
  max = 100,
  step = 1,
  value = [0],
  onValueChange,
  ...props
}: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn("h-2 w-full cursor-pointer accent-[hsl(var(--primary))]", className)}
      {...props}
    />
  );
}
