import { HydrationBoundary } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { orpc } from "@repo/orpc/react"

import { Fetcher } from "@/shared/utils/fetcher"

export default async function ({ children }: { children: ReactNode }) {
	const fetcher = new Fetcher()

	await fetcher.fetch(orpc.users.me)

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			{children}
		</HydrationBoundary>
	)
}
