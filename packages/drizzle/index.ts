import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema.ts"

const queryClient = postgres(process.env.DB_URL)

export const db = drizzle(queryClient, { schema })
