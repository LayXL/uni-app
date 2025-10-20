import { defineConfig } from "drizzle-kit"

require("dotenv").config()

if (!process.env.DB_URL) throw new Error("DB_URL is not defined")

export default defineConfig({
	schema: "./schema.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: { url: process.env.DB_URL },
	verbose: true,
	strict: true,
})
