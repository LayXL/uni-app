import { api } from "@/trpc/react"

export const Home = () => {
  const query = api.healthcheck.useQuery()

  return <div className="bg-amber-200">{query.data}</div>
}
