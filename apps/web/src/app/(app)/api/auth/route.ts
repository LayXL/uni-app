import { env } from "@/shared/utils/env"
import { isValid as checkIsValid } from "@telegram-apps/init-data-node"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const unauthorized = new Response("Unauthorized", { status: 401 })

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader) return unauthorized

  const isValid = checkIsValid(
    authHeader.split("tma ")[1],
    env.TELEGRAM_BOT_TOKEN
  )

  if (!isValid) return unauthorized

  const cookieStore = await cookies()

  cookieStore.set({
    name: "auth",
    value: authHeader,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  })

  return new Response("OK")
}
