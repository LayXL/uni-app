import { geistMono, geistSans } from "@/app/(app)/fonts"
import Providers from "@/app/(app)/providers"
import cn from "@/shared/utils/cn"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

// TODO: update title and description
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
}

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(geistMono.variable, geistSans.variable)}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
