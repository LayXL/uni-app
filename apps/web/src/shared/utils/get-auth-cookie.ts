import { parseAuthCookie } from "@/shared/utils/parse-auth-cookie"
import { cookies } from "next/headers"

export const getAuthCookie = async () => {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth")?.value as
    | `tma ${string}`
    | undefined

  return [
    authCookie ? parseAuthCookie(authCookie) : undefined,
    authCookie,
  ] as const
}
