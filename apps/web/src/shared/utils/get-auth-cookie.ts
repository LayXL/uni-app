import { cookies } from "next/headers"

export const getAuthCookie = async () => {
  const cookieStore = await cookies()

  return cookieStore.get("auth")?.value as `tma ${string}` | undefined
}
