import { getCardSettings, updateCardSettings } from "./users/card-settings"
import {
	dismissScheduleSettingsHint,
	getHints,
	resetHints,
} from "./users/hints"
import { me } from "./users/me"
import { updateNotifications } from "./users/update-notifications"
import { updateUserGroup } from "./users/update-user-group"

export default {
	getHints,
	dismissScheduleSettingsHint,
	resetHints,
	getCardSettings,
	updateCardSettings,
	me,
	updateNotifications,
	updateUserGroup,
}
