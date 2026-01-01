import type { Context as GrammyContext } from "grammy"

import type { usersTable } from "@repo/drizzle"

type UserFlavor = { user?: typeof usersTable.$inferSelect }

export type Context = GrammyContext & UserFlavor
