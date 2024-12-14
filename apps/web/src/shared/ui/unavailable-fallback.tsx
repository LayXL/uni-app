"use client"

import { useQuery } from "@tanstack/react-query"
import ky from "ky"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export const UnavailableFallback = () => {
  const router = useRouter()

  const appStatusQuery = useQuery({
    queryKey: ["appStatus"],
    queryFn: () =>
      ky.get("/api/status").json<{
        notAvailable?: boolean
        message?: string
        showSnackbar?: boolean
        snackbarMessage?: string
        snackbarType?: "info" | "warning" | "error"
      }>(),
  })

  useEffect(() => {
    if (appStatusQuery.data?.notAvailable === true) {
      router.push(`/unavailable?from=${window.location.pathname}`)
    }
  }, [appStatusQuery.data?.notAvailable, router])

  return null
}
