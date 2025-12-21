import { useSuspenseQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

export const useUser = () => {
	const { data: user } = useSuspenseQuery(orpc.users.me.queryOptions())

	return user
}
