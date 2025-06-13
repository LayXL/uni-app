import publicProcedure from "../procedures/public-procedure"
import { createCallerFactory, router } from "../trpc"

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),
})

export const createCaller = createCallerFactory(appRouter)

export type AppRouter = typeof appRouter
