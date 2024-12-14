import { UnavailableFallback } from "@/shared/ui/unavailable-fallback"
import type { ReactNode } from "react"

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen h-screen max-h-screen overflow-hidden flex flex-col">
      <div className="flex-1 overflow-scroll overscroll-contain">
        {children}
      </div>
      <UnavailableFallback />
    </div>
  )
}
