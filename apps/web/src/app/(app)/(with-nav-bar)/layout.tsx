import "./styles.css"
import { NavBarItem } from "@/features/nav-bar/ui/nav-bar-item"
import { NavBarRoot } from "@/features/nav-bar/ui/nav-bar-root"
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
      <NavBarRoot>
        {["map", "schedule", "feed"].map((item) => (
          <NavBarItem key={item} label={item} href={`/${item}`} />
        ))}
      </NavBarRoot>
    </div>
  )
}
