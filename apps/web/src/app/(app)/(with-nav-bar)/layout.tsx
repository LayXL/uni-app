import { NavBarItem } from "@/features/nav-bar/ui/nav-bar-item"
import { NavBarRoot } from "@/features/nav-bar/ui/nav-bar-root"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const t = useTranslations("navigation-bar")

  return (
    <div className="min-h-screen h-screen max-h-screen overflow-hidden flex flex-col">
      <div className="flex-1 overflow-scroll" children={children} />
      <NavBarRoot>
        {["map", "schedule", "feed"].map((item) => (
          <NavBarItem key={item} label={t(item)} href={`/${item}`} />
        ))}
      </NavBarRoot>
    </div>
  )
}
