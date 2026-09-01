import { sql } from "drizzle-orm"
import {
	bigint,
	boolean,
	check,
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

export const dailyScheduleNotificationRunsTable = pgTable(
	"daily_schedule_notification_runs",
	{
		date: date().primaryKey(),
		startedAt: timestamp().notNull().default(sql`now()`),
	},
)

export const usersTable = pgTable("users", {
	id: serial().primaryKey(),
	telegramId: bigint({ mode: "number" }).unique(),
	vkId: integer().unique(),
	group: integer().references(() => groupsTable.id),
	isAdmin: boolean().notNull().default(false),
	isEnabledNotifications: boolean().notNull().default(true),
	firstName: varchar({ length: 255 }),
	lastName: varchar({ length: 255 }),
	username: varchar({ length: 255 }),
	photoUrl: text(),
	appOpenCount: integer().notNull().default(0),
	lastAppOpenSessionId: varchar({ length: 64 }),
	lastAppOpenedAt: timestamp(),
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

export const eventsTable = pgTable("events", {
	id: serial().primaryKey(),
	createdAt: timestamp().notNull().default(sql`now()`),
	author: integer().references(() => usersTable.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	coverImage: text(),
	backgroundColor: varchar({ length: 32 }),
	borderColor: varchar({ length: 32 }),
	textColor: varchar({ length: 32 }),
	buttonColor: varchar({ length: 32 }),
	groupsRegex: text(),
	date: timestamp().notNull(),
	buttonUrl: text(),
	buttonText: varchar({ length: 255 }),
})

export const userFeedbackTable = pgTable(
	"user_feedback",
	{
		id: serial().primaryKey(),
		userId: integer()
			.notNull()
			.unique()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		rating: integer().notNull(),
		reasons: text().array().notNull().default([]),
		comment: text().notNull().default(""),
		group: integer().references(() => groupsTable.id, {
			onDelete: "set null",
		}),
		platform: varchar({ length: 32 }).notNull(),
		visitNumber: integer().notNull(),
		sessionId: varchar({ length: 64 }).notNull(),
		source: varchar({ length: 64 }).notNull().default("schedule"),
		createdAt: timestamp().notNull().default(sql`now()`),
		updatedAt: timestamp().notNull().default(sql`now()`),
	},
	(table) => [
		check(
			"user_feedback_rating_between_1_and_5",
			sql`${table.rating} between 1 and 5`,
		),
	],
)
