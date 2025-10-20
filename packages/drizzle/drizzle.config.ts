import { defineConfig } from "drizzle-kit"

import { env } from "@repo/env"

require("dotenv").config()

export default defineConfig({
	schema: "./schema.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: { url: env.databaseUrl },
	verbose: true,
	strict: true,
})
