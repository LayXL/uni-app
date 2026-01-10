import type { Viewport } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { Inter } from "next/font/google"

import { cn } from "@/shared/utils/cn"

import Providers from "./_providers"

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

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
			<body
				suppressHydrationWarning
				className={cn(inter.className, "bg-background text-foreground")}
			>
				<Providers>{children}</Providers>
				<script src="https://telegram.org/js/telegram-web-app.js"></script>
			</body>
		</html>
	)
}
