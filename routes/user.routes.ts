import express from "express";
const userRouter = express.Router();

import { userLogout, userLogin } from "../controller/auth.controller";

userRouter.get("/callback", userLogin);
userRouter.get("/logout", userLogout);
export default userRouter;
