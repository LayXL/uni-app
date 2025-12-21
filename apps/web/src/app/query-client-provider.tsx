"use client"

import {
	QueryClient,
	QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query"
import type { ReactNode } from "react"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 2 * 1000,
		},
	},
})

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
	return (
		<TanstackQueryClientProvider client={queryClient}>
			{children}
		</TanstackQueryClientProvider>
	)
}
