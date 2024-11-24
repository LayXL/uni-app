import { Events } from "@/payload/collections/events"
import { Media } from "@/payload/collections/media"
import { Users } from "@/payload/collections/users"
import { AppStatus } from "@/payload/globals/app-status"

export const collections = [Users, Media, Events]

export const globals = [AppStatus]
