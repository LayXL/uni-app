import { parse } from "date-fns/parse"

export type Lesson = {
  number: number
  subject?: string
  classroom?: string
  flow: string
  cancelled?: boolean
}

export type Schedule = {
  date: Date
  schedule: Lesson[]
}[]

export default function (html: string, group?: string): Schedule | undefined {
  try {
    const withSubgroups = html.includes("Выберите подгруппу")
    const subgroup = withSubgroups
      ? group?.split("(")[1].replace(")", "")
      : undefined

    const originalSchedule = html
      .split(
        `<div class="subgroupContent" id="withReplacements_subgroupNum_${withSubgroups ? subgroup : 0}`
      )[1]
      .split(
        withSubgroups && subgroup === "1"
          ? '<div class="subgroupContent" id="withReplacements_subgroupNum_2'
          : '<div class="container-fluid">'
      )[0]
      .replace("</div>", "")
      .split('<div class="card-body">')
      .toSpliced(0, 1)
      .map((x) => ({
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
          .map((lesson) => ({
            number: Number.parseInt(
              lesson.split("</th")[0].split("th>")[1].trim()
            ),
            subject: lesson.includes("Занятие отменено")
              ? undefined
              : lesson.split("<td>")[3].split("</td")[0].trim(),
            classroom: lesson.includes("Занятие отменено")
              ? undefined
              : lesson.split("<td>")[4].split("</td")[0].trim(),
            flow: "Все",
            cancelled: lesson.includes("Занятие отменено"),
          })),
      }))

    return html
      .split(
        `<div class="subgroupContent" id="withReplacements_subgroupNum_${withSubgroups ? subgroup : 0}`
      )[1]
      .split(
        withSubgroups && subgroup === "1"
          ? '<div class="subgroupContent" id="withReplacements_subgroupNum_2'
          : '<div class="container-fluid">'
      )[0]
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
            .map((lesson) => {
              const number = Number.parseInt(
                lesson.split("</th")[0].split("th>")[1].trim()
              )

              return {
                number,
                subject: lesson.includes("Занятие отменено")
                  ? undefined
                  : lesson.split("<td>")[3].split("</td")[0].trim(),
                classroom: lesson.includes("Занятие отменено")
                  ? undefined
                  : lesson.split("<td>")[4].split("</td")[0].trim(),
                flow: "Все",
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
