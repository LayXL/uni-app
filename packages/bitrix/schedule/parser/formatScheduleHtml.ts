import prettier from "prettier"
import { removeBreakingElements } from "./removeBreakingElements.ts"
import { removeHeadElement } from "./removeHeadElement.ts"
import { removeHtmlComments } from "./removeHtmlComments.ts"
import { removeScriptElements } from "./removeScriptElements.ts"

export const formatScheduleHtml = (html: string) => {
  return prettier.format(
    removeBreakingElements(
      removeHeadElement(removeScriptElements(removeHtmlComments(html)))
    ),
    { parser: "html" }
  )
}
