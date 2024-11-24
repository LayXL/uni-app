import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: "Пользователь",
    plural: "Пользователи",
  },
  admin: {
    useAsTitle: "displayName",
  },
  auth: true,
  fields: [
    {
      name: "displayName",
      type: "text",
    },
  ],
}
