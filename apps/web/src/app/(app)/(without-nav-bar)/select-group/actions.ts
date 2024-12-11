"use server"

import { getUserFromCookie } from "@/shared/utils/get-user-from-cookie"
import { db } from "drizzle"
import { eq } from "drizzle-orm"
import { groups, users } from "drizzle/schema"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { returnFirst } from "shared/return-first"

export async function updateGroup(formData: FormData) {
  const groupId = formData.get("groupId")

  if (!groupId) return

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, Number(groupId)))
    .then(returnFirst)

  if (!group) return

  const user = await getUserFromCookie()

  if (user) {
    db.update(users)
      .set({ group: group.id })
      .where(eq(users.telegramId, user.id))
  } else {
    const cookieStore = await cookies()
    cookieStore.set("groupId", groupId.toString())
  }

  redirect(`/schedule/${groupId}`)
}
