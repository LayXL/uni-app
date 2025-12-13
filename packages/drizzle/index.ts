import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "@repo/env"

import * as schema from "./schema"

const queryClient = postgres(env.databaseUrl)

export const db = drizzle(queryClient, { schema })

// Explicitly re-export IsNever to resolve naming conflict
export type { IsNever } from "drizzle-orm"
export * from "drizzle-orm"
export * from "drizzle-zod"

export * from "./schema"
