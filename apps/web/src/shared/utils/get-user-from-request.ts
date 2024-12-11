import { getUserFromAuthString } from "@/shared/utils/get-user-from-auth-string"
import type { NextRequest } from "next/server"

export const getUserFromRequest = async (request: NextRequest) => {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader) return null

  return getUserFromAuthString(authHeader)
}
