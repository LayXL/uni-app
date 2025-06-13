import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "МИДИС",
}

type LayoutProps = {
  children: ReactNode
}

export default function ({ children }: LayoutProps) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers children={children} />
      </body>
    </html>
  )
}
