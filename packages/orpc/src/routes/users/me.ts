import { privateProcedure } from "../../procedures/private"

export const me = privateProcedure.handler(() => {
	return {
		id: 1,
		name: "John Doe",
		email: "john.doe@example.com",
	}
})
