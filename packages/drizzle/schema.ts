import { sql } from "drizzle-orm"
import {
	bigint,
	boolean,
	date,
	integer,
	json,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core"

export const configTable = pgTable("config", {
	id: text().primaryKey().notNull(),
	json: json().notNull(),
})

export const usersTable = pgTable("users", {
	id: serial().primaryKey(),
	telegramId: bigint({ mode: "number" }).unique(),
	vkId: integer().unique(),
	group: integer().references(() => groupsTable.id),
	isAdmin: boolean().notNull().default(false),
	isEnabledNotifications: boolean().notNull().default(true),
})

export const groupTypeEnum = pgEnum("group_type", ["teacher", "studentsGroup"])

export const groupsTable = pgTable("groups", {
	id: serial().primaryKey(),
	bitrixId: varchar({ length: 255 }).notNull(),
	displayName: varchar({ length: 255 }).notNull(),
	type: groupTypeEnum().notNull().default("studentsGroup"),
	isDeleted: boolean().notNull().default(false),
})

export const subjectsTable = pgTable("subjects", {
	id: serial().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
})

export const classesTable = pgTable(
	"classes",
	{
		date: date().notNull(),
		order: integer().notNull(),
		subject: integer()
			.notNull()
			.references(() => subjectsTable.id),
		classroom: varchar({ length: 255 }).notNull(),
		isCancelled: boolean().notNull().default(false),
		isDistance: boolean().notNull().default(false),
		isChanged: boolean().notNull().default(false),
		original: json(),
		groups: integer().array().notNull().default([]),
	},
	(table) => [
		primaryKey({
			columns: [table.date, table.order, table.subject, table.classroom],
		}),
	],
)

export const homeworksTable = pgTable("homeworks", {
	id: text().primaryKey().notNull(),
	date: date().notNull(),
	subject: integer().references(() => subjectsTable.id),
	createdAt: timestamp().notNull().default(sql`now()`),
	deadline: timestamp().notNull(),
	author: integer().references(() => usersTable.id),
	group: integer().references(() => groupsTable.id),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	files: json().notNull().default([]),
	isSharedWithWholeGroup: boolean().notNull().default(false),
})

export const homeworkCompletionsTable = pgTable(
	"homework_completions",
	{
		userId: integer()
			.notNull()
			.references(() => usersTable.id),
		homeworkId: text()
			.notNull()
			.references(() => homeworksTable.id),
		completedAt: timestamp().notNull().default(sql`now()`),
	},
	(table) => [primaryKey({ columns: [table.userId, table.homeworkId] })],
)
