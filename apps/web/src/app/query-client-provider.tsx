"use client"

import {
	QueryClient,
	QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query"
import type { ReactNode } from "react"

const queryClient = new QueryClient()

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
	return (
		<TanstackQueryClientProvider client={queryClient}>
			{children}
		</TanstackQueryClientProvider>
	)
}
