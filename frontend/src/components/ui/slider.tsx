"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden bg-gray-200 border-2 border-black">
      <SliderPrimitive.Range className="absolute h-full bg-[rgb(0,82,255)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-8 w-8 border-4 border-black bg-yellow-400 shadow-[4px_4px_0_rgba(0,0,0,1)] cursor-pointer hover:bg-yellow-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 relative z-10 !important" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
