import { getAuthCookie } from "@/shared/utils/get-auth-cookie"
import { db } from "drizzle"
import { eq } from "drizzle-orm"
import { users } from "drizzle/schema"
import { redirect } from "next/navigation"

export async function GET() {
  const [, authCookie] = await getAuthCookie()

  const userId = authCookie?.user?.id

  const groupId = userId
    ? await db
        .select()
        .from(users)
        .where(eq(users.telegramId, userId))
        .then((r) => r[0]?.group)
    : undefined

  if (groupId) redirect(`/schedule/${groupId}`)
  // TODO:
  else redirect("/trash")
}
