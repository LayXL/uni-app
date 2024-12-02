import { format } from "date-fns/format"
import { parse as parseDate } from "date-fns/parse"
import parseHtml from "node-html-parser"
import { formatScheduleHtml } from "./formatScheduleHtml.ts"
import { getDifferences } from "./getDifferences.ts"
import { parseLesson } from "./parseLesson.ts"

export const parseSchedule = async (html: string, groupName: string) => {
  const root = parseHtml(await formatScheduleHtml(html))

  const subgroup = groupName.split("(")?.[1]?.split(")")?.[0] ?? 0

  const cards = root.querySelectorAll(
    `#withReplacements_subgroupNum_${subgroup} .card-body`
  )
  const originalCards = root.querySelectorAll(
    `#withoutReplacements_subgroupNum_${subgroup} .card-body`
  )

  let i = 0

  const output: ({
    date: string
    original?: Partial<ReturnType<typeof parseLesson>>
  } & ReturnType<typeof parseLesson>)[] = []

  for (const card of cards) {
    const day = card
      .querySelector("h5")
      ?.innerText.split(".")
      .slice(0, 2)
      .join(".")
      .trim()

    if (!day) continue

    const date = format(parseDate(day, "dd.MM", new Date()), "yyyy-MM-dd")

    const lessons = card.querySelectorAll("tbody>tr")

    let j = 0

    for (const lesson of lessons) {
      const originalLesson = originalCards[i].querySelectorAll("tbody>tr")[j]

      const parsedLesson = parseLesson(lesson)
      const { isChanged: _, ...originalParsedLesson } =
        parseLesson(originalLesson)

      output.push({
        date,
        ...parsedLesson,
        ...(parsedLesson.isChanged
          ? { original: getDifferences(parsedLesson, originalParsedLesson) }
          : {}),
      })

      j++
    }

    i++
  }

  return output
}
