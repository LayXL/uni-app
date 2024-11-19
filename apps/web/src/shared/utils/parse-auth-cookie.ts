import { toObjectWithCamelCase } from "@/shared/utils/to-object-with-camel-case"
import type { InitData } from "@telegram-apps/init-data-node"

export const parseAuthCookie = (authCookie: string) => {
  const parsed = Object.fromEntries(
    authCookie
      ?.split("tma ")[1]
      .split("&")
      .map((s) => s.split("="))
  )

  const obj = {
    ...parsed,
    user: JSON.parse(decodeURIComponent(parsed.user)),
  }

  return toObjectWithCamelCase(obj) as InitData
}
