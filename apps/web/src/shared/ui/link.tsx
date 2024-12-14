"use client"

import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useRef } from "react"

export const Link: typeof NextLink = (({ children, ...props }) => {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const router = useRouter()

  return (
    <NextLink
      ref={linkRef}
      onMouseDown={(e) => {
        const url = new URL(String(props.href), window.location.href)
        if (
          url.origin === window.location.origin &&
          e.button === 0 &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey
        ) {
          e.preventDefault()
          router.push(String(props.href))
        }
      }}
      {...props}
    >
      {children}
    </NextLink>
  )
}) as typeof NextLink
