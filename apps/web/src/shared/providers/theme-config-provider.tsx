"use client"

import { useSignal } from "@/shared/hooks/use-signal"
import { miniApp } from "@telegram-apps/sdk-react"
import { useTheme } from "next-themes"
import { type ReactNode, useEffect } from "react"

type ThemeConfigProviderProps = {
  children: ReactNode
}

export const ThemeConfigProvider = ({ children }: ThemeConfigProviderProps) => {
  const { setTheme } = useTheme()

  const isDark = useSignal(miniApp.isDark)

  useEffect(() => {
    setTheme(isDark ? "dark" : "light")
  }, [setTheme, isDark])

  return children
}
