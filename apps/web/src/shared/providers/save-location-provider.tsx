"use client"

import { usePathname } from "next/navigation"
import { type ReactNode, useEffect } from "react"

type SaveLocationProviderProps = {
  children: ReactNode
}

export const SaveLocationProvider = ({
  children,
}: SaveLocationProviderProps) => {
  const pathname = usePathname()

  useEffect(() => {
    window.localStorage.setItem("location", pathname)
  }, [pathname])

  return children
}
