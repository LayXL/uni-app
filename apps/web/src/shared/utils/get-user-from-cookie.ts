import { getUserFromAuthString } from "@/shared/utils/get-user-from-auth-string"
import { cookies } from "next/headers"

export const getUserFromCookie = async () => {
  const authCookie = (await cookies()).get("auth")?.value
  if (!authCookie) return null

  return getUserFromAuthString(authCookie)
}
