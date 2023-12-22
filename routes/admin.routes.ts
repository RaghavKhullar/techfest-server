import express from "express";
const adminRouter = express.Router();

import upload from "../utils/fileUpload";
import { adminLogout, adminLogin } from "../controller/auth.controller";
import {
    addAdmin,
    addTask,
    addUser,
    allocateSubTask,
    getAllProjects,
    getCurrentAdmin,
    addProject,
    addSubTask,
    deallocateSubTask,
    removeProject,
    removeSubTask,
    removeTask,
    editProject,
    editSubtask,
    editTask,
    getSubTasksOfTask,
    getTasksOfProject,
} from "../controller/admin.controller";
import { authenticateTokenAdmin } from "../utils/verifyToken";

adminRouter.get("/callback", adminLogin);
adminRouter.get("/logout", adminLogout);

adminRouter.get("/getDetails", authenticateTokenAdmin, getCurrentAdmin);
adminRouter.post("/addUser", authenticateTokenAdmin, addUser);
adminRouter.post("/addAdmin", authenticateTokenAdmin, addAdmin);

adminRouter.post("/addTask", authenticateTokenAdmin, addTask);
adminRouter.post(
    "/addSubtask",
    authenticateTokenAdmin,
    upload.single("file"),
    addSubTask
);
adminRouter.post("/addProject", authenticateTokenAdmin, addProject);

adminRouter.post("/deleteTask", authenticateTokenAdmin, removeTask);
adminRouter.post("/deleteSubtask", authenticateTokenAdmin, removeSubTask);
adminRouter.post("/deleteProject", authenticateTokenAdmin, removeProject);

adminRouter.post("/editTask", authenticateTokenAdmin, editTask);
adminRouter.post(
    "/editSubtask",
    authenticateTokenAdmin,
    upload.single("file"),
    editSubtask
);
adminRouter.post("/editProject", authenticateTokenAdmin, editProject);

adminRouter.post("/allocateSubTask", authenticateTokenAdmin, allocateSubTask);
adminRouter.post(
    "/deallocateSubTask",
    authenticateTokenAdmin,
    deallocateSubTask
);

adminRouter.get("/getProjects", authenticateTokenAdmin, getAllProjects);
adminRouter.post("/getTasks", authenticateTokenAdmin, getTasksOfProject);
adminRouter.post("/getSubTasks", authenticateTokenAdmin, getSubTasksOfTask);

export default adminRouter;
