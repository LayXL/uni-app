import Link from "next/link"
import type { ReactNode } from "react"

type NavBarItemProps = {
  label: ReactNode
  onClick?: () => void
  href?: string
}

export const NavBarItem = (props: NavBarItemProps) => {
  const body = (
    <div className="py-2 px-1">
      <p className="text-center">{props.label}</p>
    </div>
  )

  return props.href ? (
    <Link href={props.href}>{body}</Link>
  ) : props.onClick ? (
    <button type="button" onClick={props.onClick}>
      {body}
    </button>
  ) : (
    body
  )
}
