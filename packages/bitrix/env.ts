export const env = {
  BITRIX_URL: (process.env.BITRIX_URL ?? Bun.env.BITRIX_URL) as string,
}
