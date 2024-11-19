"use client"

import type { ReactNode } from "react"

type ThemeConfigProviderProps = {
  children: ReactNode
}

export const ThemeConfigProvider = (props: ThemeConfigProviderProps) => {
  // const isDark = useSignal(miniApp.isDark)
  //
  // useEffect(() => {
  //   setTheme(isDark ? "dark" : "light")
  // }, [setTheme, isDark])
  //
  // useEffect(() => {
  //   const unsub = on("theme_changed", (theme) => {
  //     console.log(theme)
  //   })
  //
  //   return () => unsub()
  // })

  return props.children
}
