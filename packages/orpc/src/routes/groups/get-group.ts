import { ORPCError } from "@orpc/client"
import z from "zod"

import { and, db, eq, groupsTable } from "@repo/drizzle"
import { env } from "@repo/env"
import { testingGroup, testingTeacherGroups } from "@repo/shared/testing-group"

import { publicProcedure } from "../../procedures/public"
import { withAvatar } from "./with-avatar"

export const getGroup = publicProcedure
	.input(
		z.object({
			id: z.number(),
		}),
	)
	.handler(async ({ input }) => {
		const testingGroupOrTeacher = [testingGroup, ...testingTeacherGroups].find(
			(group) => group.id === input.id,
		)

		if (env.testingGroupEnabled && testingGroupOrTeacher) {
			return withAvatar(testingGroupOrTeacher)
		}

		const group = await db
			.select()
			.from(groupsTable)
			.where(
				and(eq(groupsTable.id, input.id), eq(groupsTable.isDeleted, false)),
			)
			.limit(1)
			.then(([group]) => group)

		if (!group) {
			throw new ORPCError("NOT_FOUND")
		}

		return withAvatar(group)
	})
