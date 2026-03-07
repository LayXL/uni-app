import { isTelegram } from "./is-telegram"

export const isVK = () => typeof window !== "undefined" && !isTelegram()
