import { updateGroup } from "@/app/(app)/(without-nav-bar)/select-group/actions"
import ClientSelectGroup from "@/app/(app)/(without-nav-bar)/select-group/client"
import { db } from "drizzle"
import { asc } from "drizzle-orm"
import { groups } from "drizzle/schema"
import { getTranslations } from "next-intl/server"
import Form from "next/form"
import { transformToGroupName } from "shared/groups/transform-to-group-name"

export default async function Page() {
  const t = await getTranslations("select-group")

  const allGroups = await db
    .select()
    .from(groups)
    .orderBy(asc(groups.isTeacher), asc(groups.displayName))
    .then((groups) =>
      groups.map((group) => ({
        ...group,
        displayName: transformToGroupName(group),
      }))
    )

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h2 children={t("title")} />
      </div>
      <Form action={updateGroup}>
        <ClientSelectGroup groups={allGroups} />
      </Form>
    </div>
  )
}
