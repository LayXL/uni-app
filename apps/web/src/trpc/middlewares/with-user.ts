import { TRPCError } from "@trpc/server"
import { db } from "drizzle"
import { eq } from "drizzle-orm"
import { sessions, users } from "drizzle/schema"
import { returnFirst } from "shared/return-first"
import { middleware } from "../trpc"

export const withUser = middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionToken, ctx.session))
    .leftJoin(users, eq(users.id, sessions.userId))
    .then(returnFirst)

  if (!session || !session.users) throw new TRPCError({ code: "UNAUTHORIZED" })

  return next({
    ctx: {
      session: ctx.session,
      user: session.users,
    },
  })
})
