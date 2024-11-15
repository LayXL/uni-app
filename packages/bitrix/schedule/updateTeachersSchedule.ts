// import { redis } from "../redis";
// import {
// 	getRedisKeyDayGroupSchedule,
// 	getRedisKeyDayGroupTeachers,
// } from "../redis/keys";
// import getTeacherSchedule from "./getTeacherSchedule";
//
// export default async () => {
// 	const teachers = JSON.parse(
// 		(await redis.get("teachers")) as string,
// 	) as unknown as {
// 		name: string;
// 		id: string;
// 	}[];
//
// 	for (const teacher of teachers) {
// 		console.log(`Getting schedule for teacher ${teacher.name}`);
//
// 		const teacherSchedule = await getTeacherSchedule(teacher.id);
//
// 		for (const day of teacherSchedule?.schedule ?? []) {
// 			const { date, schedule } = day;
//
// 			for (const lesson of schedule) {
// 				if (!lesson.group) continue;
//
// 				const current = JSON.parse(
// 					(await redis.get(getRedisKeyDayGroupTeachers(lesson.group, date))) ??
// 						"[]",
// 				) as { number: number; teacher: string }[];
//
// 				if (
// 					current.find(
// 						(x) => x.number === lesson.number && x.teacher === teacher.name,
// 					)
// 				)
// 					continue;
//
// 				await redis.setEx(
// 					getRedisKeyDayGroupTeachers(lesson.group, date),
// 					60 * 60 * 60,
// 					JSON.stringify(
// 						[
// 							...current,
// 							{
// 								number: lesson.number,
// 								teacher: teacher.name.replace("нет ", " "),
// 							},
// 						],
// 						undefined,
// 						4,
// 					),
// 				);
// 			}
//
// 			redis.setEx(
// 				getRedisKeyDayGroupSchedule(teacher.id, date),
// 				60 * 60 * 60,
// 				JSON.stringify(schedule, undefined, 4),
// 			);
// 		}
// 	}
// };
