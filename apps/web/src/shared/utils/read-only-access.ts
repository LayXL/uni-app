import type { Access } from "payload"

export const readOnlyAccess: { read: Access } = {
  read: () => true,
}
