"use client"

import { useEffect } from "react"

export default function Page() {
  useEffect(() => {
    const location = window.localStorage.getItem("location")

    if (!location || location === window.location.pathname) {
      window.location.replace("/map")
      return
    }

    window.location.replace(location)
  }, [])

  return null
}
