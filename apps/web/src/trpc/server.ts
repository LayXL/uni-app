"use server"

import { createContext as createTRPCContext } from "@/trpc/context"
import { type AppRouter, createCaller } from "@/trpc/router"
import { createHydrationHelpers } from "@trpc/react-query/rsc"
import { headers } from "next/headers"
import { unauthorized } from "next/navigation"
import { cache } from "react"
import { createQueryClient } from "./query-client"

const createContext = cache(async () => {
  const heads = new Headers(await headers())
  heads.set("x-trpc-source", "rsc")

  return createTRPCContext({ headers: heads })
})

const getQueryClient = cache(createQueryClient)
const caller = createCaller(createContext, {
  onError: (opts) => {
    if (opts.error.code === "UNAUTHORIZED") unauthorized()

    console.error(opts.error)
  },
})

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
)
