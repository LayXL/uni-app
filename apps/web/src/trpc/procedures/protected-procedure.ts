import { withUser } from "@/trpc/middlewares/with-user"
import { withAuth } from "../middlewares/with-auth"
import { procedure } from "../trpc"

export default procedure.use(withAuth).use(withUser)
