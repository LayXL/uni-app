import { parse } from "date-fns/parse"

export type TeacherLesson = {
  number: number
  subject?: string
  group?: string
  classroom?: string
  flow?: string
  cancelled?: boolean
}

export type TeacherSchedule = {
  date: Date
  schedule: TeacherLesson[]
}[]

export default function (html: string): TeacherSchedule | undefined {
  try {
    const originalSchedule = html
      .split('<div class="subgroupContent withReplacements"')[1]
      .split('<div class="container-fluid">')[1]
      .replace("</div>", "")
      .split('<div class="card-body">')
      .toSpliced(0, 1)
      .map((x) => {
        return {
          date: parse(
            x
              .split("h5")[1]
              .split(". ")[0]
              .split(">")
              .findLast(() => true) ?? "",
            "dd.MM",
            new Date()
          ),
          schedule: x
            .split("</tbody>")[0]
            .split("<tbody>")[1]
            .split("<tr")
            .toSpliced(0, 1)
            .filter((x) => x.trim().length > 2)
            .map((lesson) => {
              return {
                number: Number.parseInt(
                  lesson.split("</th")[0].split("th>")[1].trim()
                ),
                group: lesson.split("<td>")[1].split("</td")[0].trim(),
                subject: lesson.includes("Занятие отменено")
                  ? undefined
                  : lesson.split("<td>")[4].split("</td")[0].trim(),
                classroom: lesson.includes("Занятие отменено")
                  ? undefined
                  : lesson.split("<td>")[5].split("</td")[0].trim(),
                cancelled: lesson.includes("Занятие отменено"),
              }
            }),
        }
      })

    return html
      .split('<div class="subgroupContent withReplacements"')[1]
      .split('<div class="container-fluid">')[0]
      .replace("</div>", "")
      .split('<div class="card-body">')
      .toSpliced(0, 1)
      .map((x) => {
        const date = parse(
          x
            .split("h5")[1]
            .split(". ")[0]
            .split(">")
            .findLast(() => true) ?? "",
          "dd.MM",
          new Date()
        )

        return {
          date,
          schedule: x
            .split("</tbody>")[0]
            .split("<tbody>")[1]
            .split("<tr")
            .toSpliced(0, 1)
            .filter((x) => x.trim().length > 2)
            .map((lesson) => {
              const number = Number.parseInt(
                lesson.split("</th")[0].split("th>")[1].trim()
              )

              return {
                number,
                group: lesson.split("<td>")[1].split("</td")[0].trim(),
                subject: lesson.includes("Занятие отменено")
                  ? undefined
                  : lesson.split("<td>")[4].split("</td")[0].trim(),
                classroom: lesson.includes("Занятие отменено")
                  ? undefined
                  : lesson.split("<td>")[5].split("</td")[0].trim(),
                cancelled: lesson.includes("Занятие отменено"),
                modified: lesson.includes("table-danger"),
                original: lesson.includes("table-danger")
                  ? originalSchedule
                      .find((x) => x.date.getTime() === date.getTime())
                      ?.schedule.find((x) => x.number === number)
                  : undefined,
              }
            }),
        }
      })
  } catch (e) {
    return undefined
  }
}
