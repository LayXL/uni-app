// import cookie from "cookie"
import type { users } from "drizzle/schema"

export const createContext = async (opts: { headers?: Headers }) => ({
  // session:
  //   cookie.parse(opts.headers?.get("cookie") ?? "")["authjs.session-token"] ??
  //   null,
  user: null as unknown as typeof users.$inferSelect,
  ...opts,
})

export type Context = Awaited<ReturnType<typeof createContext>>
