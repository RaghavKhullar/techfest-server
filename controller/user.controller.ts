import { isValidObjectId } from "mongoose";
import SubtaskModel from "../models/task/subtask.model";
import TaskModel, { priorityMap, statusMap } from "../models/task/task.model";
import UserModel from "../models/user/user.model";
import ProjectModel from "../models/task/project.model";

export const getCurrentUser = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        return res.status(200).json({ data: user });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUserProfile = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const age = req.body.age;
        const isMarried = req.body.isMarried;

        const updateQuery: any = {
            age: req.body.age,
            isMarried: req.body.isMarried,
        };
        if (req.body.isFileUpdated == "true") {
            updateQuery.image = req.file?.filename || "";
        }

        await UserModel.findByIdAndUpdate(req.userId, updateQuery);
        return res
            .status(200)
            .json({ message: "Profile updated successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllProjects = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const projects = await ProjectModel.find();

        const data = await Promise.all(
            projects.map(async (project) => {
                const childTasks = await Promise.all(
                    project.childTasks.map(async (taskId) => {
                        const task = await TaskModel.findById(taskId);
                        if (task) {
                            return {
                                name: task.name,
                                id: task._id,
                            };
                        }
                    })
                );
                return {
                    name: project.name,
                    id: project._id,
                    deadline: project.deadline,
                    childTasks: childTasks,
                    description: project.description || "",
                    status: project.status || statusMap.TODO,
                    priority: project.priority || priorityMap.LOW,
                    creationTime: project._id.getTimestamp(),
                };
            })
        );
        return res.status(200).json({ data: data });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getTasksOfProject = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const projectId = req.body.projectId;
        if (!isValidObjectId(projectId)) {
            return res.status(400).json({ message: "Invalid params" });
        }

        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(400).json({ message: "Project not found" });
        }

        const data = await Promise.all(
            project.childTasks.map(async (taskId) => {
                const task = await TaskModel.findById(taskId);
                if (task) {
                    const subTasks = await Promise.all(
                        task.childTasks.map(async (subTaskId) => {
                            const subTask =
                                await SubtaskModel.findById(subTaskId);
                            if (subTask) {
                                return {
                                    name: subTask.name,
                                    id: subTask._id,
                                };
                            }
                        })
                    );
                    return {
                        name: task.name,
                        deadline: task.deadline,
                        childTasks: subTasks,
                        status: task.status || statusMap.TODO,
                        description: task.description || "",
                        id: task._id,
                        priority: task.priority || priorityMap.LOW,
                        creationTime: task._id.getTimestamp(),
                    };
                }
            })
        );
        const finalData = {
            projectName: project.name,
            projectId: project._id,
            tasks: data,
        };
        return res.status(200).json({ data: finalData });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getSubTasksOfTask = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const projectId = req.body.projectId;
        const taskId = req.body.taskId;
        if (!isValidObjectId(taskId) || !isValidObjectId(projectId)) {
            return res.status(400).json({ message: "Invalid params" });
        }

        const project = await ProjectModel.findOne({
            _id: projectId,
            childTasks: taskId,
        });
        if (!project) {
            return res
                .status(400)
                .json({ message: "Project or task not found" });
        }

        const task = await TaskModel.findById(taskId);
        if (!task) {
            return res.status(400).json({ message: "Task not found" });
        }

        const data = await Promise.all(
            task.childTasks.map(async (subTaskId) => {
                const subTask = await SubtaskModel.findById(subTaskId);
                if (subTask) {
                    let returnUser = undefined;
                    if (isValidObjectId(subTask.allotedUsers)) {
                        const user = await UserModel.findById(
                            subTask.allotedUsers
                        );
                        if (user) {
                            returnUser = {
                                name: user.name,
                                id: user._id,
                                image: user.image || "",
                            };
                        }
                    }
                    return {
                        name: subTask.name,
                        deadline: subTask.deadline,
                        id: subTask._id,
                        status: subTask.status || statusMap.TODO,
                        description: subTask.description || "",
                        allotedUsers: returnUser,
                        priority: subTask.priority || priorityMap.LOW,
                        document: subTask.document || "",
                        userDocument: subTask.userDocument || "",
                        creationTime: subTask._id.getTimestamp(),
                    };
                }
            })
        );
        const finalData = {
            projectName: project.name,
            projectId: project._id,
            taskName: task.name,
            taskId: task._id,
            subTasks: data,
        };
        return res.status(200).json({ data: finalData });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const editSubtask = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const subtaskId = req.body.subtaskId;
        const status = req.body.status || statusMap.TODO;
        const fileName = req.file?.filename || "";
        if (!isValidObjectId(subtaskId)) {
            return res.status(400).json({ message: "Invalid params" });
        }
        const updateQuery: any = {
            status: status,
        };
        if (req.body.isFileUpdated == "true") {
            updateQuery.userDocument = fileName;
        }
        const newUpdatedTask = await SubtaskModel.findOneAndUpdate(
            { _id: subtaskId },
            updateQuery
        );
        if (!newUpdatedTask) {
            return res
                .status(400)
                .json({ message: "Requested sub task doesn't exist" });
        }
        return res
            .status(200)
            .json({ message: "Sub task edited successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getDetailsForAnalytics = async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const absentDays = user.absences;

        let todoSubTask = 0,
            completeSubTask = 0,
            inProgressSubTask = 0;

        const subTasks = await Promise.all(
            user.allotedTasks.map(async (subTaskId) => {
                if (isValidObjectId(subTaskId)) {
                    const subTask = await SubtaskModel.findById(subTaskId);
                    if (subTask) {
                        if (subTask.status == statusMap.TODO) ++todoSubTask;
                        else if (subTask.status == statusMap.COMPLETE)
                            ++completeSubTask;
                        else if (subTask.status == statusMap.PROGRESS)
                            ++inProgressSubTask;
                        return {
                            name: subTask.name,
                            deadline: subTask.deadline || new Date(),
                            priority: subTask.priority || priorityMap.LOW,
                            status: subTask.status || statusMap.TODO,
                        };
                    }
                }
            })
        );

        return res.status(200).json({
            absentDays: user.absences || 0,
            todoSubTask: todoSubTask,
            completeSubTask: completeSubTask,
            inProgressSubTask: inProgressSubTask,
            subTasks: subTasks,
            currentRating: user.currentRating,
            stressBurnoutScore: user.stressBurnoutScore || 0,
            moral: user.moral || "Moderate",
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};
