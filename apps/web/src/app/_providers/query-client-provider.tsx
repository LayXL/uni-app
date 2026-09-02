"use client"

import {
	QueryClient,
	QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query"
import type { ReactNode } from "react"

const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000,
				gcTime: 10 * 60 * 1000,
			},
		},
	})

let browserQueryClient: QueryClient | undefined

const getQueryClient = () => {
	if (typeof window === "undefined") return createQueryClient()

	browserQueryClient ??= createQueryClient()
	return browserQueryClient
}

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
	return (
		<TanstackQueryClientProvider client={getQueryClient()}>
			{children}
		</TanstackQueryClientProvider>
	)
}
