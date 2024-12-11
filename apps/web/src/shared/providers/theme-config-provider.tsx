"use client"

import { useSignal } from "@/shared/hooks/use-signal"
import {
  expandViewport,
  miniApp,
  setMiniAppBackgroundColor,
  setMiniAppHeaderColor,
  viewport,
} from "@telegram-apps/sdk-react"
import { useTheme } from "next-themes"
import { type ReactNode, useEffect } from "react"

type ThemeConfigProviderProps = {
  children: ReactNode
}

export const ThemeConfigProvider = ({ children }: ThemeConfigProviderProps) => {
  const { setTheme } = useTheme()

  const state = useSignal(miniApp.state)
  const isDark = useSignal(miniApp.isDark)

  useEffect(() => {
    setTheme(isDark ? "dark" : "light")

    if (
      state?.headerColor &&
      setMiniAppHeaderColor.isAvailable() &&
      setMiniAppHeaderColor.supports.rgb()
    ) {
      setMiniAppHeaderColor(isDark ? "#000000" : "#ffffff")
    }

    if (state?.headerColor && setMiniAppBackgroundColor.isAvailable()) {
      setMiniAppBackgroundColor(isDark ? "#000000" : "#ffffff")
    }

    if (viewport.isMounted()) {
      expandViewport()
    }
  }, [setTheme, isDark, state?.headerColor])

  return children
}
