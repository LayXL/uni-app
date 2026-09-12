import { useSuspenseQuery } from "@tanstack/react-query"

import { GUEST_USER_ID } from "@repo/orpc/client"
import { orpc } from "@repo/orpc/react"

export const useUser = () => {
	const { data: user } = useSuspenseQuery(orpc.users.me.queryOptions())

	return { ...user, isGuest: user.id === GUEST_USER_ID }
}
