import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        ref={ref}
        className={cn(
          "relative inline-flex h-6 w-12 items-center border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all cursor-pointer",
          checked ? "bg-green-400" : "bg-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform bg-white border-2 border-black transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }