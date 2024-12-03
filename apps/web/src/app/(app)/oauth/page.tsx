import getSession from "bitrix/session/get-session"
import { getUserData } from "bitrix/user/get-user-data"
import { redirect } from "next/navigation"

export default function Page() {
  async function auth(formData: FormData) {
    "use server"

    const rawFormData = {
      login: formData.get("login"),
      password: formData.get("password"),
    }

    if (!rawFormData.login || !rawFormData.password) return

    const session = await getSession(
      rawFormData.login.toString(),
      rawFormData.password.toString()
    )

    const userData = await getUserData(session.user_id, session.cookie)

    redirect("/")
  }

  return (
    <div className="w-screen h-screen grid place-items-center">
      <div className="flex flex-col w-[420px] bg-neutral-2">
        <h1>Auth with Bitrix</h1>
        <p>It's safe</p>
        <form className="flex flex-col" action={auth}>
          <input
            placeholder="login"
            type="text"
            name="login"
            autoComplete="work email webauthn"
          />
          <input
            placeholder="password"
            type="password"
            name="password"
            autoComplete="work email webauthn"
          />
          <button type="submit" children="Submit" />
        </form>
      </div>
    </div>
  )
}
