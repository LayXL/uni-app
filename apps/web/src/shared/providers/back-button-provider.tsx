"use client"

import { backButton } from "@telegram-apps/sdk-react"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

type BackButtonProviderProps = {
  children: ReactNode
}

export const BackButtonProvider = ({ children }: BackButtonProviderProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(pathname !== "/" && window.history.length > 1)
    }
  }, [pathname])

  useEffect(() => {
    if (backButton.isMounted()) {
      if (canGoBack) backButton.show()
      else backButton.hide()

      return backButton.onClick(() => {
        router.back()
      })
    }
  }, [router.back, canGoBack])

  return children
}
