"use client"

import { useLaunchParams } from "@telegram-apps/sdk-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const Page = () => {
  const { initDataRaw } = useLaunchParams()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth", {
      method: "POST",
      headers: {
        Authorization: `tma ${initDataRaw}`,
      },
    }).then((r) => {
      if (!r.ok) return
      void router.replace("/")
    })
  }, [initDataRaw])

  return <div>Login</div>
}

export default dynamic(() => Promise.resolve(Page), {
  ssr: false,
})
