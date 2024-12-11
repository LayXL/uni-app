import type { ReactNode } from "react"

type NavBarRootProps = {
  children: ReactNode
}

export const NavBarRoot = (props: NavBarRootProps) => {
  return (
    <div className="border-t border-t-neutral-3 pb-[var(--safe-area-bottom)] flex *:flex-1">
      {props.children}
    </div>
  )
}
