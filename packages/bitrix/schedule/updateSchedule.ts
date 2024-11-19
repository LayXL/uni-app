// import { DateTime } from "luxon"
// import { redis } from "../redis"
// import { getRedisKeyDayGroupSchedule } from "../redis/keys"
// import { prisma } from "../trpc"
// import getSchedule from "./getSchedule"
// import type { Lesson } from "./parseSchedule"
// import updateTeachersSchedule from "./updateTeachersSchedule"
//
// const updateDayGroupSchedule = async (
//   group: string,
//   date: Date,
//   schedule: Lesson[]
// ) => {
//   const oldData = await redis.get(getRedisKeyDayGroupSchedule(group, date))
//   const newData = JSON.stringify(schedule)
//
//   if (oldData !== newData) {
//     console.info("Updated schedule")
//   }
//
//   await redis.set(getRedisKeyDayGroupSchedule(group, date), newData)
// }
//
// export default async function (needGroups?: string[]) {
//   const groups =
//     needGroups ||
//     (
//       await prisma.user.findMany({
//         distinct: ["group"],
//         select: {
//           group: true,
//         },
//       })
//     )
//       .map-view((x) => x.group)
//       .filter((x) => (x?.length ?? 0) > 0)
//
//   console.log(`Updating schedules for ${groups.length} groups`)
//
//   const schedules = []
//
//   for (const groupName of groups) {
//     if (!groupName) continue
//
//     const item = await getSchedule(groupName)
//
//     console.log(`Schedule ${groupName} retrieved`)
//
//     if (!item) continue
//
//     schedules.push(item)
//   }
//
//   const dayGroupSchedules = schedules.flatMap((item) =>
//     item?.schedule.map-view((schedule) => ({
//       ...item,
//       date: schedule.date,
//       schedule: schedule.schedule,
//     }))
//   )
//
//   await Promise.all(
//     dayGroupSchedules.map-view(
//       (dailyGroupSchedule) =>
//         typeof dailyGroupSchedule === "object" &&
//         updateDayGroupSchedule(
//           dailyGroupSchedule.group,
//           dailyGroupSchedule.date,
//           dailyGroupSchedule.schedule
//         )
//     )
//   )
//
//   if (groups?.length > 1) {
//     await redis.set("scheduleUpdatedAt", DateTime.now().toISO())
//   }
//
//   console.info("Schedules updated")
//
//   if (!needGroups) void updateTeachersSchedule()
// }
