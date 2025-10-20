import { flow } from "lodash-es"
import prettier from "prettier"

import { removeBreakingElements } from "./remove-breaking-elements"
import { removeHeadElement } from "./remove-head-element"
import { removeHtmlComments } from "./remove-html-comments"
import { removeScriptElements } from "./remove-script-elements"

export const formatScheduleHtml = (html: string) => {
	const cleanHtml = flow([
		removeHtmlComments,
		removeScriptElements,
		removeHeadElement,
		removeBreakingElements,
	])

	return prettier.format(cleanHtml(html), { parser: "html" })
}
