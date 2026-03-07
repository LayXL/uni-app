import { createHomework } from "./homeworks/create-homework"
import { deleteHomework } from "./homeworks/delete-homework"
import { getHomework } from "./homeworks/get-homework"
import { getHomeworks } from "./homeworks/get-homeworks"
import { toggleCompletion } from "./homeworks/toggle-completion"
import { updateHomework } from "./homeworks/update-homework"
import { uploadFile } from "./homeworks/upload-file"

export default {
	createHomework,
	updateHomework,
	deleteHomework,
	getHomework,
	getHomeworks,
	toggleCompletion,
	uploadFile,
}
