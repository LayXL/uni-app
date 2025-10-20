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
} from "drizzle-orm/pg-core"

export const usersTable = pgTable("users", {
	id: serial().primaryKey(),
	telegramId: bigint({ mode: "number" }),
	group: integer().references(() => groupsTable.id),
})

export const groupTypeEnum = pgEnum("group_type", ["teacher", "studentsGroup"])

export const groupsTable = pgTable("groups", {
	id: serial().primaryKey(),
	bitrixId: text().notNull(),
	displayName: text().notNull(),
	type: groupTypeEnum().notNull().default("studentsGroup"),
})

export const subjectsTable = pgTable("subjects", {
	id: serial().primaryKey(),
	name: text().notNull(),
})

export const classesTable = pgTable(
	"classes",
	{
		date: date().notNull(),
		order: integer().notNull(),
		subject: integer()
			.notNull()
			.references(() => subjectsTable.id),
		classroom: text().notNull(),
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
