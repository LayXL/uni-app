import prettier from "prettier"
import { removeBreakingElements } from "./remove-breaking-elements.ts"
import { removeHeadElement } from "./remove-head-element.ts"
import { removeHtmlComments } from "./remove-html-comments.ts"
import { removeScriptElements } from "./remove-script-elements.ts"

export const formatScheduleHtml = (html: string) => {
  return prettier.format(
    removeBreakingElements(
      removeHeadElement(removeScriptElements(removeHtmlComments(html)))
    ),
    { parser: "html" }
  )
}
