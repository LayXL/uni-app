import { getUserFromCookie } from "@/shared/utils/get-user-from-cookie"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserFromCookie()

  const groupId = user ? user.group : Number(cookieStore.get("groupId")?.value)

  if (groupId) redirect(`/schedule/${groupId}`)
  else redirect("/select-group")
}
