import { appRouter } from "@/trpc/router"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api",
    req: request,
    router: appRouter,
    createContext: async () => ({
      // auth here from cookies
      ...request.headers,
    }),
  })

export { handler as GET, handler as POST }
