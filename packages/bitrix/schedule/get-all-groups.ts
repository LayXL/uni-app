export async function getAllGroups(cookie: string) {
	const groups: string[] = []
	const teachers: { id: string; name: string }[] = []

	const grades = [3, 4]

	for (const grade of grades) {
		const response = await fetch(
			`${<string>Bun.env.BITRIX_URL}local/handlers/schedule/groups.php`,
			{
				method: "POST",
				body: `gradeLevel=${grade}`,
				headers: {
					Cookie: cookie,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		)

		const body = (await response.json()) as Record<
			string,
			{ GROUP_NAME: string }
		>

		for (const group of Object.values(body).map(
			({ GROUP_NAME }) => GROUP_NAME,
		)) {
			console.info(`Parsing ${group}`)

			const groupSchedule = await (
				await fetch(
					`${<string>Bun.env.BITRIX_URL}mobile/teacher/schedule/spo_and_vo.php?name=${group}`,
					{
						method: "GET",
						headers: {
							Cookie: cookie,
							"Content-Type": "application/x-www-form-urlencoded",
						},
					},
				)
			).text()

			if (!groupSchedule.includes("subgroupContent")) continue

			if (groupSchedule.includes("Выберите подгруппу")) {
				console.info(`Group ${group} has subgroups!`)

				groups.push(
					...groupSchedule
						.split('id="subgroupSelect">')[1]
						.split("</select")[0]
						.split('">')
						.toSpliced(0, 1)
						.map((x) => x.split("</")[0]),
				)
			} else groups.push(group)
		}
	}

	console.info("Groups parsed!")

	const departments = await getAllDepartments(cookie)

	for (const department of departments) {
		const response = await fetch(
			`${<string>Bun.env.BITRIX_URL}local/handlers/schedule/users.php`,
			{
				method: "POST",
				body: `gradeLevel=57&group=${department}`,
				headers: {
					Cookie: cookie,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		)

		const body = (await response.json()) as { USER_ID: string; NAME: string }[]

		teachers.push(
			...body.map((teacher) => ({
				name: teacher.NAME.replace(" нет", " "),
				id: teacher.USER_ID,
			})),
		)
	}

	console.info("Teachers parsed")

	return {
		groups,
		teachers,
	}
}

async function getAllDepartments(cookie: string) {
	return Object.values(
		(await (
			await fetch(
				`${<string>Bun.env.BITRIX_URL}local/handlers/schedule/groups.php`,
				{
					method: "POST",
					body: "gradeLevel=57",
					headers: {
						Cookie: cookie,
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
			)
		).json()) as Record<string, { GROUP_ID: string }>,
	).map(({ GROUP_ID }) => GROUP_ID)
}
