import { payload } from "@/shared/utils/payload"

export async function GET() {
  const { notAvailable, message, showSnackbar, snackbarMessage, snackbarType } =
    await payload.findGlobal({ slug: "app-status" })

  return new Response(
    JSON.stringify({
      notAvailable,
      message,
      showSnackbar,
      snackbarMessage,
      snackbarType,
    })
  )
}
