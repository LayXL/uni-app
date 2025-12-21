import type { QueryKey } from "@tanstack/react-query"
import { dehydrate, QueryClient } from "@tanstack/react-query"

import { getAuthHeaders } from "./fetch"

type Procedure<Input, Output> = {
	call: (
		input: Input,
		options?: { context?: { headers?: Headers } },
	) => Promise<Output>
	// biome-ignore lint/suspicious/noExplicitAny: Dynamic query key
	queryKey: (...args: any[]) => QueryKey
}

const createQueryKey = <Input>(
	procedure: Procedure<Input, unknown>,
	input: Input | undefined,
): QueryKey => {
	if (input === undefined) {
		return procedure.queryKey({})
	}

	return procedure.queryKey({ input })
}

export class Fetcher {
	private readonly client: QueryClient

	constructor() {
		this.client = new QueryClient()
	}

	get queryClient() {
		return this.client
	}

	dehydrate() {
		return dehydrate(this.client)
	}

	async fetch<Input, Output>(
		procedure: Procedure<Input, Output>,
		input?: Input,
	) {
		const headers = await getAuthHeaders()

		const data = await procedure.call(input as Input, {
			context: { headers },
		})

		this.client.setQueryData(createQueryKey(procedure, input), data)

		return data
	}
}
