import { getAuthCookie } from "@/shared/utils/get-auth-cookie"
import { parse } from "@telegram-apps/init-data-node/web"

export default async function Home() {
  const authCookie = await getAuthCookie()

  const parsed = parse(authCookie)

  return <div>Hello, {parsed.user?.username}</div>
}
