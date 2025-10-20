import { base } from "../base"
import { authMiddleware } from "../middlewares/auth"

export const privateProcedure = base.use(authMiddleware)
