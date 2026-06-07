import { HydrationBoundary } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { orpc } from "@repo/orpc/react"

import { UnauthorizedPage } from "@/shared/ui/unauthorized-page"
import { Fetcher } from "@/shared/utils/fetcher"

const isUnauthorizedError = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	(("code" in error && error.code === "UNAUTHORIZED") ||
		("status" in error && error.status === 401))

export default async function ({ children }: { children: ReactNode }) {
	const fetcher = new Fetcher()

	try {
		await fetcher.fetch(orpc.users.me)
	} catch (error) {
		if (isUnauthorizedError(error)) {
			return <UnauthorizedPage />
		}

		throw error
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			{children}
		</HydrationBoundary>
	)
}
