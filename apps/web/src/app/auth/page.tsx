"use client"

import { useLaunchParams } from "@telegram-apps/sdk-react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const Page = () => {
  const { initDataRaw } = useLaunchParams()

  useEffect(() => {
    fetch("/api/auth", {
      method: "POST",
      headers: {
        Authorization: `tma ${initDataRaw}`,
      },
    }).then((r) => {
      if (!r.ok) return
      window.location.href = "/"
    })
  }, [initDataRaw])

  return <div>Login</div>
}

export default dynamic(() => Promise.resolve(Page), {
  ssr: false,
})
