"use client"
import { backButton } from "@telegram-apps/sdk-react"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

type ThemeConfigProviderProps = {
  children: ReactNode
}

export const ThemeConfigProvider = (props: ThemeConfigProviderProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(pathname !== "/" && window.history.length > 1)
    }
  }, [pathname])

  useEffect(() => {
    if (canGoBack) backButton.show()
    else backButton.hide()

    return backButton.onClick(() => {
      console.log(true)
      router.back()
    })
  }, [router.back, canGoBack])

  return props.children
}
