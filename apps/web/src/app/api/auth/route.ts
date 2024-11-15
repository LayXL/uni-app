import { isValid as checkIsValid } from "@telegram-apps/init-data-node"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string

if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not defined")

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader) return new Response("Unauthorized", { status: 401 })

  const isValid = checkIsValid(authHeader.split("tma ")[1], TELEGRAM_BOT_TOKEN)

  if (!isValid) return new Response("Unauthorized", { status: 401 })

  const cookieStore = await cookies()

  cookieStore.set({
    name: "auth",
    value: authHeader,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  })

  return new Response("OK")
}
