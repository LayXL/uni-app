import {
  bigint,
  date,
  integer,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial().primaryKey(),
  telegramId: bigint({ mode: "number" }),
  group: integer().references(() => groups.id),
})

export const teachers = pgTable("teachers", {
  id: serial().primaryKey(),
})

export const groups = pgTable("groups", {
  id: serial().primaryKey(),
})

export const subjects = pgTable("subjects", {
  id: serial().primaryKey(),
  name: text().notNull(),
})

export const classes = pgTable("classes", {
  id: serial().primaryKey(),
  date: date().notNull(),
  order: integer().notNull(),
  group: integer()
    .notNull()
    .references(() => groups.id),
  subject: integer()
    .notNull()
    .references(() => subjects.id),
})

export const classTeachers = pgTable("class_teachers", {
  classId: integer()
    .notNull()
    .references(() => classes.id),
  teacherId: integer()
    .notNull()
    .references(() => teachers.id),
})
