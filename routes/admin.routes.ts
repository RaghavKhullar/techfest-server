import express from "express";
const adminRouter = express.Router();

import { adminLogout, adminLogin } from "../controller/auth.controller";
import {
    addAdmin,
    addTask,
    addUser,
    allocateTask,
} from "../controller/admin.controller";
import { authenticateTokenAdmin } from "../utils/verifyToken";

adminRouter.get("/callback", adminLogin);
adminRouter.get("/logout", adminLogout);
adminRouter.post("/addUser", authenticateTokenAdmin, addUser);
adminRouter.post("/addUser", authenticateTokenAdmin, addAdmin);
adminRouter.post("/addUser", authenticateTokenAdmin, addTask);
adminRouter.post("/addUser", authenticateTokenAdmin, allocateTask);

export default adminRouter;
