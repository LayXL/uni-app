import { db } from "drizzle"
import { eq } from "drizzle-orm"
import { groups } from "drizzle/schema"
import type { CollectionConfig } from "payload"

export const Events: CollectionConfig = {
  slug: "events",
  labels: {
    singular: "Событие",
    plural: "События",
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      label: "Название",
      type: "text",
      required: true,
    },
    {
      name: "shortDescription",
      label: "Краткое описание",
      type: "text",
    },
    {
      name: "groups",
      label: "Участники",
      type: "text",
      hasMany: true,
      admin: {
        components: {
          afterInput: [
            {
              path: "@/shared/ui/after-input-groups",
              clientProps: {
                groups: await db
                  .select()
                  .from(groups)
                  .where(eq(groups.isTeacher, false))
                  .then((group) => group.map((group) => group.displayName)),
              },
            },
          ],
        },
      },
    },
    {
      name: "place",
      label: "Место проведения",
      type: "text",
    },
    {
      name: "cover",
      label: "Обложка",
      type: "upload",
      relationTo: "media",
    },
    {
      type: "row",
      fields: [
        {
          name: "startDate",
          label: "Дата начала",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayAndTime" },
          },
        },
        {
          name: "endDate",
          label: "Дата конца",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayAndTime" },
          },
        },
      ],
    },
    {
      name: "urls",
      label: "Быстрые ссылки",
      type: "array",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "name",
              label: "Название ссылки",
              type: "text",
            },
            {
              name: "url",
              label: "Ссылка",
              type: "text",
            },
          ],
        },
      ],
    },
  ],
}
