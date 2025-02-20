import { collections, globals } from "@/payload"
import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { ru } from "@payloadcms/translations/languages/ru"
import { buildConfig } from "payload"
import sharp from "sharp"

if (!process.env.PAYLOAD_SECRET)
  throw new Error("PAYLOAD_SECRET is not defined")

if (!process.env.MONGO_DB_URL) throw new Error("DATABASE_URL is not defined")

export default buildConfig({
  routes: {
    api: "/payload-api",
  },
  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: "ru",
  },
  editor: lexicalEditor(),
  collections,
  globals,
  secret: process.env.PAYLOAD_SECRET,
  db: mongooseAdapter({ url: process.env.MONGO_DB_URL }),
  sharp,
})
