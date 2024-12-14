"use client"

import { useQuery } from "@tanstack/react-query"
import ky from "ky"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const t = useTranslations("unavailable")

  const router = useRouter()
  const searchParams = new URLSearchParams(window.location.search)

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
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (appStatusQuery.data?.notAvailable === false) {
      router.replace(searchParams.get("from") || "/")
    }
  }, [appStatusQuery.data?.notAvailable, router, searchParams.get])

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
      <h1 children={t("title")} />
      <p children={appStatusQuery.data?.message || t("message")} />
    </div>
  )
}
