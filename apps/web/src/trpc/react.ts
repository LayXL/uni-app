import type { AppRouter } from "@/trpc/router"
import { createTRPCReact } from "@trpc/react-query"

export const api = createTRPCReact<AppRouter>()
