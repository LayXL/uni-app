import { env } from "@/shared/utils/env"
import { isValid as checkIsValid, parse } from "@telegram-apps/init-data-node"
import { db } from "drizzle"
import { eq } from "drizzle-orm"
import { users } from "drizzle/schema"
import { returnFirst } from "shared/return-first"

export const getUserFromAuthString = async (
  authString: string
): Promise<typeof users.$inferSelect | null> => {
  const isValid = checkIsValid(
    authString.split("tma ")[1],
    env.TELEGRAM_BOT_TOKEN
  )

  if (!isValid) return null

  const parsedData = parse(authString)
  if (!parsedData.user?.id) return null

  const user = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, parsedData.user.id))
    .then(returnFirst)

  return !user
    ? ((await db
        .insert(users)
        .values({
          telegramId: parsedData.user.id,
        })
        .returning()
        .then(returnFirst)) ?? null)
    : user
}
