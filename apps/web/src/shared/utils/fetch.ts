import { cookies } from "next/headers"

type ProcedureHandler<Input, Output> = (
	input: Input,
	options?: { context?: { headers?: Headers } },
) => Promise<Output>

export const fetch = async <Input, Output>(
	fn: ProcedureHandler<Input, Output>,
	input: Input,
): Promise<Output> => {
	const cookiesMap = await cookies()

	const headers = new Headers()

	headers.set("authorization", cookiesMap.get("session")?.value ?? "")

	return fn(input, {
		context: { headers },
	})
}
