import { ORPCError } from "@orpc/client"
import { z } from "zod"

import { db, eq, groupsTable, usersTable } from "@repo/drizzle"
import { env } from "@repo/env"
import { isTestingGroupId, testingGroup } from "@repo/shared/testing-group"

import { privateProcedure } from "../../procedures/private"

const ensureTestingGroupExists = () =>
	db
		.insert(groupsTable)
		.values(testingGroup)
		.onConflictDoUpdate({
			target: groupsTable.id,
			set: {
				bitrixId: testingGroup.bitrixId,
				displayName: testingGroup.displayName,
				type: testingGroup.type,
				isDeleted: false,
			},
		})

export const updateUserGroup = privateProcedure
	.input(
		z.object({
			groupId: z.number().nullable(),
		}),
	)
	.handler(async ({ context, input }) => {
		if (input.groupId) {
			if (isTestingGroupId(input.groupId)) {
				if (!env.testingGroupEnabled) {
					throw new ORPCError("NOT_FOUND", {
						message: "Group not found",
					})
				}

				await ensureTestingGroupExists()
			}

			const group = await db.query.groupsTable.findFirst({
				where: eq(groupsTable.id, input.groupId),
			})

			if (!group) {
				throw new ORPCError("NOT_FOUND", {
					message: "Group not found",
				})
			}
		}

		await db
			.update(usersTable)
			.set({ group: input.groupId })
			.where(eq(usersTable.id, context.user.id))

		return {
			success: true,
		}
	})
