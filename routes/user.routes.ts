import express from "express";
const userRouter = express.Router();

import { userLogout, userLogin } from "../controller/auth.controller";
import {
    getCurrentUser,
    getDetailsForAnalytics,
} from "../controller/user.controller";
import { authenticateUserToken } from "../utils/verifyToken";

userRouter.get("/callback", userLogin);
userRouter.get("/logout", userLogout);

userRouter.get("/getDetails", authenticateUserToken, getCurrentUser);
userRouter.get("/getUserStats", authenticateUserToken, getDetailsForAnalytics);
export default userRouter;
