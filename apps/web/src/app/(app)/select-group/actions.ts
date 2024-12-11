"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function updateGroup(formData: FormData) {
  const groupId = formData.get("groupId")

  if (!groupId) return

  const cookieStore = await cookies()

  cookieStore.set("groupId", groupId.toString())
  redirect(`/schedule/${groupId}`)
}
