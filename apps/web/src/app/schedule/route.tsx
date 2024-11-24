import { getAuthCookie } from "@/shared/utils/get-auth-cookie"
import { db } from "drizzle"
import { eq } from "drizzle-orm"
import { users } from "drizzle/schema"
import { redirect } from "next/navigation"
import { returnFirst } from "shared/return-first"

export async function GET() {
  const [authCookie] = await getAuthCookie()
  const userId = authCookie?.user?.id

  const groupId = userId
    ? await db
        .select()
        .from(users)
        .where(eq(users.telegramId, userId))
        .then(returnFirst)
        .then((r) => r?.group)
    : undefined

  if (groupId) redirect(`/schedule/${groupId}`)
  else redirect("/selectGroup")
}
