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
	varchar,
} from "drizzle-orm/pg-core"

export const configTable = pgTable("config", {
	id: text().primaryKey().notNull().unique(),
	json: json().notNull(),
})

export const usersTable = pgTable("users", {
	id: serial().primaryKey(),
	telegramId: bigint({ mode: "number" }),
	vkId: integer(),
	group: integer().references(() => groupsTable.id),
	isAdmin: boolean().notNull().default(false),
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
