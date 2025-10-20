import prettier from "prettier"

import { removeBreakingElements } from "./remove-breaking-elements"
import { removeHeadElement } from "./remove-head-element"
import { removeHtmlComments } from "./remove-html-comments"
import { removeScriptElements } from "./remove-script-elements"

export const formatScheduleHtml = (html: string) => {
	return prettier.format(
		removeBreakingElements(
			removeHeadElement(removeScriptElements(removeHtmlComments(html))),
		),
		{ parser: "html" },
	)
}
