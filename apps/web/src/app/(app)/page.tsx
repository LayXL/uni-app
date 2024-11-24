import Link from "next/link"

export default async function Home() {
  // const authCookie = await getAuthCookie()
  // const parsed = parse(authCookie)

  return (
    <Link href={"/apps/web/src/app/(app)/schedule"} children={"Schedule"} />
  )
}
