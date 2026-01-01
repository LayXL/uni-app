import type { ReactNode } from "react"
import "./globals.css"

import { Inter } from "next/font/google"

import Providers from "./providers"

const inter = Inter({
	subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
	variable: "--font-inter",
})

type LayoutProps = {
	children: ReactNode
}

export default function ({ children }: LayoutProps) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body suppressHydrationWarning className="bg-background text-foreground">
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
