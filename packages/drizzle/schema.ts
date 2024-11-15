import { bigint, pgTable, serial } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial().primaryKey(),
  telegramId: bigint({ mode: "number" }).notNull(),
})
