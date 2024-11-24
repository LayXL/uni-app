import type { CollectionConfig } from "payload"
import { readOnlyAccess } from "@/shared/utils/read-only-access"

export const Media: CollectionConfig = {
  slug: "media",
  access: readOnlyAccess,
  fields: [
    {
      name: "alt",
      type: "text",
      required: false,
    },
  ],
  upload: true,
}
