"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-4 group-[.toaster]:border-black group-[.toaster]:shadow-[6px_6px_0_rgba(0,0,0,1)] group-[.toaster]:rounded-[3px] group-[.toaster]:min-w-[350px] group-[.toaster]:p-4 group-[.toaster]:font-['Noyh-Bold',sans-serif]",
          description: "group-[.toast]:text-current group-[.toast]:opacity-90",
          icon: "group-[.toast]:flex-shrink-0",
          content: "group-[.toast]:flex group-[.toast]:items-start group-[.toast]:gap-3 group-[.toast]:w-full group-[.toast]:pl-12",
          title: "group-[.toast]:font-black group-[.toast]:text-base",
          actionButton:
            "group-[.toast]:bg-yellow-400 group-[.toast]:text-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:font-black group-[.toast]:uppercase",
          cancelButton:
            "group-[.toast]:bg-gray-300 group-[.toast]:text-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:font-black group-[.toast]:uppercase",
          closeButton: 
            "group-[.toast]:bg-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:text-white group-[.toast]:hover:bg-gray-800",
          error: 
            "group-[.toaster]:bg-red-500 group-[.toaster]:text-white group-[.toaster]:border-black group-[.toaster]:font-black",
          success:
            "group-[.toaster]:bg-green-500 group-[.toaster]:text-white group-[.toaster]:border-black group-[.toaster]:font-black",
          warning:
            "group-[.toaster]:bg-yellow-400 group-[.toaster]:text-black group-[.toaster]:border-black group-[.toaster]:font-black",
          info:
            "group-[.toaster]:bg-blue-500 group-[.toaster]:text-white group-[.toaster]:border-black group-[.toaster]:font-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
