import { createEvent } from "./events/create-event"
import { deleteEvent } from "./events/delete-event"
import { getAllEvents } from "./events/get-all-events"
import { getEvents } from "./events/get-events"
import { updateEvent } from "./events/update-event"
import { uploadCover } from "./events/upload-cover"

export default {
	createEvent,
	updateEvent,
	deleteEvent,
	getEvents,
	getAllEvents,
	uploadCover,
}
