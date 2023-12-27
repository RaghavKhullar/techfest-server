import express from "express";
const userRouter = express.Router();

import { userLogout, userLogin } from "../controller/auth.controller";
import {
    allocatedSubtasks,
    calendarData,
    editSubtask,
    getAllProjects,
    getCurrentUser,
    getDetailsForAnalytics,
    getSubTasksOfTask,
    getTasksOfProject,
    improveText,
    summariseText,
    updateUserProfile,
    writeEmail,
} from "../controller/user.controller";
import { authenticateUserToken } from "../utils/verifyToken";
import upload from "../utils/fileUpload";
import imageUpload from "../utils/imageUpload";

userRouter.get("/callback", userLogin);
userRouter.get("/logout", userLogout);

userRouter.get("/getDetails", authenticateUserToken, getCurrentUser);
userRouter.get("/getUserStats", authenticateUserToken, getDetailsForAnalytics);

userRouter.get("/getProjects", authenticateUserToken, getAllProjects);
userRouter.post("/getTasks", authenticateUserToken, getTasksOfProject);
userRouter.post("/getSubTasks", authenticateUserToken, getSubTasksOfTask);
userRouter.post(
    "/editSubtask",
    authenticateUserToken,
    upload.single("file"),
    editSubtask
);
userRouter.post(
    "/updateProfile",
    authenticateUserToken,
    imageUpload.single("file"),
    updateUserProfile
);
userRouter.get("/getAllotedSubtasks", authenticateUserToken, allocatedSubtasks);
userRouter.get("/getTasksCalendar", authenticateUserToken, calendarData);
userRouter.post("/writeEmail", authenticateUserToken, writeEmail);
userRouter.post("/improveWriting", authenticateUserToken, improveText);
userRouter.post("/summariseText", authenticateUserToken, summariseText);

export default userRouter;
