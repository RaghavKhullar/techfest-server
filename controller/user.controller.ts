import { isValidObjectId } from "mongoose";
import SubtaskModel from "../models/task/subtask.model";
import TaskModel, { priorityMap, statusMap } from "../models/task/task.model";
import UserModel from "../models/user/user.model";
import ProjectModel from "../models/task/project.model";
import axios from "axios";
import config from "../config/config";

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
        const projectData = data.filter(
            (val) => val != null && val != undefined
        );
        return res.status(200).json({ data: projectData });
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
        const tasks = data.filter((val) => val != undefined && val != null);
        const finalData = {
            projectName: project.name,
            projectId: project._id,
            tasks: tasks,
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
                        deadline: subTask.deadline || new Date(),
                        predictedDeadline:
                            subTask.predictedDeadline || new Date(),
                        id: subTask._id,
                        status: subTask.status || statusMap.TODO,
                        description: subTask.description || "",
                        allotedUsers: returnUser,
                        priority: subTask.priority || priorityMap.LOW,
                        document: subTask.document || "",
                        userDocument: subTask.userDocument || "",
                        creationTime: subTask.startDate || new Date(),
                    };
                }
            })
        );

        const subtasks = data.filter((val) => val != undefined && val != null);
        const finalData = {
            projectName: project.name,
            projectId: project._id,
            taskName: task.name,
            taskId: task._id,
            subTasks: subtasks,
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
            { _id: subtaskId, allotedUsers: req.userId },
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

        const data = await Promise.all(
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
        const subTasks = data.filter((val) => val != undefined && val != null);
        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image || "",
                gender: user.gender || "Male",
                age: user.age || 0,
                isMarried: user.isMarried || false,
                role: user.role || "HR",
                salary: user.salary || 0,
                joiningDate: user.joiningDate || new Date(),
                position: user.position || "Intern",
            },
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

export const allocatedSubtasks = async (req: any, res: any) => {
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
        const subTasks = await Promise.all(
            user.allotedTasks.map(async (subTaskId) => {
                if (isValidObjectId(subTaskId)) {
                    const subTask = await SubtaskModel.findById(subTaskId);
                    const task = await TaskModel.findOne({
                        childTasks: subTaskId,
                    });
                    if (task && subTask) {
                        const project = await ProjectModel.findOne({
                            childTasks: task._id,
                        });
                        if (project) {
                            return {
                                projectId: project._id,
                                projectName: project.name,
                                taskId: task._id,
                                taskName: task.name,
                                id: subTask._id,
                                name: subTask.name,
                                deadline: subTask.deadline || new Date(),
                                predictedDeadline:
                                    subTask.predictedDeadline || new Date(),
                                priority: subTask.priority || priorityMap.LOW,
                                status: subTask.status || statusMap.TODO,
                                document: subTask.document || "",
                                userDocument: subTask.userDocument || "",
                                description: subTask.description || "",
                                creationTime: subTask.startDate,
                            };
                        }
                    }
                }
            })
        );
        const data = subTasks.filter((val) => val != undefined && val != null);
        const finalData = {
            user: {
                id: user._id,
                name: user.name,
                image: user.image || "",
            },
            subTasks: data,
        };
        return res.status(200).json({ data: finalData });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const calendarData = async (req: any, res: any) => {
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
        const subTasks = await Promise.all(
            user.allotedTasks.map(async (subTaskId) => {
                if (isValidObjectId(subTaskId)) {
                    const subTask = await SubtaskModel.findById(subTaskId);
                    const task = await TaskModel.findOne({
                        childTasks: subTaskId,
                    });
                    if (task && subTask) {
                        const project = await ProjectModel.findOne({
                            childTasks: task._id,
                        });
                        if (project) {
                            return {
                                projectId: project._id,
                                projectName: project.name,
                                taskId: task._id,
                                taskName: task.name,
                                id: subTask._id,
                                name: subTask.name,
                                deadline:
                                    new Date(subTask.deadline) || new Date(),
                                priority: subTask.priority || priorityMap.LOW,
                                status: subTask.status || statusMap.TODO,
                                document: subTask.document || "",
                                userDocument: subTask.userDocument || "",
                                description: subTask.description || "",
                                creationTime: subTask.startDate,
                            };
                        }
                    }
                }
            })
        );
        const data = subTasks.filter((val) => val != undefined && val != null);
        const map = new Map();
        data.forEach((entry) => {
            if (entry) {
                const year = entry.deadline.getFullYear();
                const month = entry.deadline.getMonth();
                if (map.has(year)) {
                    if (map.get(year).has(month)) {
                        map.get(year).get(month).push(entry);
                    } else {
                        map.get(year).set(month, [entry]);
                    }
                } else {
                    map.set(year, new Map());
                    map.get(year).set(month, [entry]);
                }
            }
        });
        function mapToJson(map: any) {
            let result = {};
            map.forEach((value: any, key: any) => {
                if (value instanceof Map) {
                    value = mapToJson(value);
                }
                // @ts-ignore
                result[key] = value;
            });
            return result;
        }
        const result = mapToJson(map);
        return res.status(200).json({ data: result });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const writeEmail = async (req: any, res: any) => {
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

        const points = req.body.emailPoints;
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/generate_email",
            data: { email_points: points },
        });
        if (response.status == 200) {
            return res.status(200).json(response.data.email);
        } else {
            return res
                .status(400)
                .json({ message: "Error occured while generating" });
        }
    } catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const improveText = async (req: any, res: any) => {
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

        const points = req.body.text;
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/improve",
            data: { original_text: points },
        });
        if (response.status == 200) {
            return res.status(200).json(response.data.improved_text);
        } else {
            return res
                .status(400)
                .json({ message: "Error occured while generating" });
        }
    } catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const summariseText = async (req: any, res: any) => {
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

        const points = req.body.text;
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/summarise",
            data: { text: points },
        });
        if (response.status == 200) {
            return res.status(200).json(response.data.summary);
        } else {
            return res
                .status(400)
                .json({ message: "Error occured while generating" });
        }
    } catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getReview = async (req: any, res: any) => {
    try {
        const points = req.body.id;
        if (!isValidObjectId(points)) {
            return res.status(400).json({ message: "Invalid params" });
        }
        const requestUser = await UserModel.findById(points);
        if (!requestUser) {
            return res.status(400).json({ message: "User not found;" });
        }
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/get_employee_review",
            data: { name: requestUser.name },
        });
        if (response.status == 200) {
            return res.status(200).json(response.data.review);
        } else {
            return res
                .status(400)
                .json({ message: "Error occured while generating" });
        }
    } catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};
