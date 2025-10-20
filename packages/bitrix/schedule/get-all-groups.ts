import { bitrix } from "../ky"

export async function getAllGroups(cookie: string) {
	const groups: {
		bitrixId: string
		displayName: string
		type: "teacher" | "studentsGroup"
	}[] = []

	const grades = [3, 4]

	for (const grade of grades) {
		const data = await bitrix
			.post("local/handlers/schedule/groups.php", {
				body: `gradeLevel=${grade}`,
				headers: {
					Cookie: cookie,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			})
			.json<Record<string, { GROUP_NAME: string; GROUP_ID: string }>>()

		for (const group of Object.values(data)) {
			console.info(`Parsing ${group.GROUP_NAME}`)

			const groupSchedule = await bitrix
				.get(
					`mobile/teacher/schedule/spo_and_vo.php?name=${group.GROUP_NAME}`,
					{
						method: "GET",
						headers: {
							Cookie: cookie,
							"Content-Type": "application/x-www-form-urlencoded",
						},
					},
				)
				.text()

			if (!groupSchedule.includes("subgroupContent")) continue

			if (groupSchedule.includes("Выберите подгруппу")) {
				console.info(`Group ${group.GROUP_NAME} has subgroups!`)

				groups.push(
					...groupSchedule
						.split('id="subgroupSelect">')[1]
						.split("</select")[0]
						.split('">')
						.toSpliced(0, 1)
						.map((x: string) => ({
							displayName: x.split("</")[0],
							bitrixId: group.GROUP_ID,
							type: "studentsGroup" as const,
						})),
				)
			} else
				groups.push({
					bitrixId: group.GROUP_ID,
					displayName: group.GROUP_NAME,
					type: "studentsGroup",
				})
		}
	}

	console.info("Groups parsed!")

	const departments = await getAllDepartments(cookie)

	for (const department of departments) {
		const data = await bitrix
			.post("local/handlers/schedule/users.php", {
				body: `gradeLevel=57&group=${department}`,
				headers: {
					Cookie: cookie,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			})
			.json<{ USER_ID: string; NAME: string }[]>()

		groups.push(
			...data.map((teacher) => ({
				bitrixId: teacher.USER_ID,
				displayName: teacher.NAME.replace(" нет", " "),
				type: "teacher" as const,
			})),
		)
	}

	console.info("Teachers parsed")

	return groups
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
