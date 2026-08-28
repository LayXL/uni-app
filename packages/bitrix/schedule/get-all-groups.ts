import { bitrix } from "../ky"

const BITRIX_REQUEST_COOLDOWN_MS = 100

type Group = {
	bitrixId: string
	displayName: string
	type: "teacher" | "studentsGroup"
}

type BitrixGroup = {
	GROUP_NAME: string
	GROUP_ID: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mapSequentially = async <Input, Output>(
	items: Input[],
	mapper: (item: Input) => Promise<Output>,
) => {
	const results: Output[] = []

	for (const item of items) {
		results.push(await mapper(item))
		await sleep(BITRIX_REQUEST_COOLDOWN_MS)
	}

	return results
}

const getGroupsForGrade = async (grade: number, cookie: string) => {
	const data = await bitrix
		.post("local/handlers/schedule/groups.php", {
			body: `gradeLevel=${grade}`,
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})
		.json<Record<string, BitrixGroup>>()

	return Object.values(data)
}

const parseStudentGroup = async (
	group: BitrixGroup,
	cookie: string,
): Promise<Group[]> => {
	try {
		const groupSchedule = await bitrix
			.get("mobile/teacher/schedule/spo_and_vo.php", {
				searchParams: { name: group.GROUP_NAME },
				headers: {
					Cookie: cookie,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			})
			.text()

		if (!groupSchedule.includes("subgroupContent")) return []

		if (!groupSchedule.includes("Выберите подгруппу")) {
			return [
				{
					bitrixId: group.GROUP_ID,
					displayName: group.GROUP_NAME,
					type: "studentsGroup",
				},
			]
		}

		return groupSchedule
			.split('id="subgroupSelect">')[1]
			.split("</select")[0]
			.split('">')
			.toSpliced(0, 1)
			.map((option) => ({
				displayName: option.split("</")[0],
				bitrixId: group.GROUP_ID,
				type: "studentsGroup" as const,
			}))
	} catch (error) {
		throw new Error(
			`Failed to parse Bitrix group ${group.GROUP_NAME} (${group.GROUP_ID})`,
			{ cause: error },
		)
	}
}

const getTeachersForDepartment = async (
	department: string,
	cookie: string,
): Promise<Group[]> => {
	try {
		const data = await bitrix
			.post("local/handlers/schedule/users.php", {
				body: `gradeLevel=57&group=${department}`,
				headers: {
					Cookie: cookie,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			})
			.json<{ USER_ID: string; NAME: string }[]>()

		return data.map((teacher) => ({
			bitrixId: teacher.USER_ID,
			displayName: teacher.NAME.replace(" нет", " "),
			type: "teacher",
		}))
	} catch (error) {
		throw new Error(
			`Failed to fetch Bitrix teachers for department ${department}`,
			{ cause: error },
		)
	}
}

export async function getAllGroups(cookie: string) {
	const startedAt = Date.now()
	const groupsByGrade = await mapSequentially([3, 4], (grade) =>
		getGroupsForGrade(grade, cookie),
	)
	const fetchedStudentGroups = groupsByGrade.flat()
	const studentGroupSources = [
		...new Map(
			fetchedStudentGroups.map((group) => [
				JSON.stringify([group.GROUP_ID, group.GROUP_NAME]),
				group,
			]),
		).values(),
	]
	const studentGroups = (
		await mapSequentially(studentGroupSources, (group) =>
			parseStudentGroup(group, cookie),
		)
	).flat()

	const departments = [...new Set(await getAllDepartments(cookie))]
	await sleep(BITRIX_REQUEST_COOLDOWN_MS)
	const teachers = (
		await mapSequentially(departments, (department) =>
			getTeachersForDepartment(department, cookie),
		)
	).flat()

	// biome-ignore lint/suspicious/noConsole: Operational diagnostics for group synchronization
	console.info("Bitrix groups parsed", {
		studentGroupSources: studentGroupSources.length,
		studentGroups: studentGroups.length,
		departments: departments.length,
		teachers: teachers.length,
		total: studentGroups.length + teachers.length,
		requestCooldownMs: BITRIX_REQUEST_COOLDOWN_MS,
		durationMs: Date.now() - startedAt,
	})

	return [...studentGroups, ...teachers]
}

async function getAllDepartments(cookie: string): Promise<string[]> {
	const data = await bitrix
		.post("local/handlers/schedule/groups.php", {
			body: "gradeLevel=57",
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})
		.json<Record<string, { GROUP_ID: string }>>()

	return Object.values(data).map(({ GROUP_ID }) => GROUP_ID)
}
