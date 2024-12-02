import {
  bigint,
  boolean,
  date,
  integer,
  json,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial().primaryKey(),
  telegramId: bigint({ mode: "number" }),
  group: integer().references(() => groups.id),
})

export const groups = pgTable("groups", {
  id: serial().primaryKey(),
  bitrixId: text().notNull(),
  displayName: text().notNull(),
  isTeacher: boolean().notNull().default(false),
})

export const subjects = pgTable("subjects", {
  id: serial().primaryKey(),
  name: text().notNull(),
})

export const classes = pgTable(
  "classes",
  {
    date: date().notNull(),
    order: integer().notNull(),
    subject: integer()
      .notNull()
      .references(() => subjects.id),
    classroom: text().notNull(),
    isCancelled: boolean().notNull().default(false),
    isDistance: boolean().notNull().default(false),
    isChanged: boolean().notNull().default(false),
    original: json(),
    groups: integer().array().notNull().default([]),
  },
  (table) => ({
    pk: [table.date, table.order, table.subject, table.classroom],
  })
)
