"use client"

import nextDynamic from "next/dynamic"

const App = nextDynamic(() => import("@/client"), { ssr: false })

export const dynamic = "force-static"

export default function Page() {
  return <App />
}
