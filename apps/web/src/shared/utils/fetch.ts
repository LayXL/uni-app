import { cookies } from "next/headers"

type ProcedureHandler<Input, Output> = (
	input: Input,
	options?: { context?: { headers?: Headers } },
) => Promise<Output>

export const getAuthHeaders = async () => {
	const cookiesMap = await cookies()

	const headers = new Headers()

	headers.set("authorization", cookiesMap.get("session")?.value ?? "")

	return headers
}

export const fetch = async <Input, Output>(
	fn: ProcedureHandler<Input, Output>,
	input: Input,
): Promise<Output> => {
	const headers = await getAuthHeaders()

	return fn(input, {
		context: { headers },
	})
}
