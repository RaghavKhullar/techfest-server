import express from "express";
const adminRouter = express.Router();

import { adminLogout, adminLogin } from "../controller/auth.controller";

adminRouter.get("/callback", adminLogin);
adminRouter.get("/logout", adminLogout);
export default adminRouter;
