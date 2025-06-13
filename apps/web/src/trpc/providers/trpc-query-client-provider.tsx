"use client"

import { api } from "@/trpc/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getFetch, httpBatchLink, loggerLink } from "@trpc/react-query"
import type { ReactNode } from "react"
import { useState } from "react"
import superjson from "superjson"

const queryClient = new QueryClient()

type TRPCQueryClientProviderProps = {
  children: ReactNode
}

export const TrpcQueryClientProvider = ({
  children,
}: TRPCQueryClientProviderProps) => {
  const url =
    process.env.NEXT_PUBLIC_APP_DOMAIN &&
    !process.env.NEXT_PUBLIC_APP_DOMAIN.includes("localhost")
      ? `http://${process.env.NEXT_PUBLIC_APP_DOMAIN}/api/`
      : "http://localhost:3000/api/"

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({ enabled: () => true }),
        httpBatchLink({
          url,
          fetch: async (input, init?) => {
            const fetch = getFetch()
            return fetch(input, {
              ...init,
              credentials: "include",
            })
          },
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  )
}
