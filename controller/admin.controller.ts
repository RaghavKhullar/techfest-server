import TaskModel, { priorityMap, statusMap } from "../models/task/task.model";
import AdminModel from "../models/user/admin.model";
import AllowedUserModel from "../models/user/allowedUser.model";
import UserModel from "../models/user/user.model";
import ProjectModel from "../models/task/project.model";
import SubtaskModel from "../models/task/subtask.model";
import { isValidObjectId } from "mongoose";
import axios from "axios";
import config from "../config/config";

const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@gmail\.com$/);

export const addUser = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const email = req.body.email;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid user email" });
        }
        const name = req.body.name;
        const gender = req.body.gender;
        const role = req.body.role;
        const salary = req.body.salary;
        const position = req.body.position;
        const joiningDate = req.body.joiningDate;

        const user = await UserModel.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        await AllowedUserModel.findOneAndUpdate(
            { email: email, isAdmin: false },
            { email: email, isAdmin: false },
            { upsert: true, new: true }
        );
        const newUser = await UserModel.create({
            name: name,
            email: email,
            gender: gender,
            role: role,
            salary: salary,
            position: position,
            joiningDate: joiningDate,
        });
        await newUser.save();

        return res.status(200).json({ message: "User successfully added" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addAdmin = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const email = req.body.email;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid user email" });
        }

        await AllowedUserModel.findOneAndUpdate(
            { email: email, isAdmin: true },
            { email: email, isAdmin: true },
            { upsert: true, new: true }
        );
        return res.status(200).json({ message: "Admin successfully added" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addProject = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const name = req.body.name;
        const deadline = req.body.deadline || new Date();
        const description = req.body.description;
        const priority = req.body.priority || priorityMap.LOW;
        if (
            !name ||
            name.length == 0 ||
            !description ||
            description.length == 0
        ) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        const newProject = await ProjectModel.create({
            name: name,
            deadline: deadline,
            description: description,
            priority: priority,
        });
        await newProject.save();

        return res.status(200).json({
            data: newProject._id,
            message: "Project created successfully",
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const name = req.body.name;
        const deadline = req.body.deadline || new Date();
        const description = req.body.description;
        const projectId = req.body.projectId;
        const priority = req.body.priority || priorityMap.LOW;
        if (
            !isValidObjectId(projectId) ||
            !name ||
            name.length == 0 ||
            !description ||
            description.length == 0
        ) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        const currentProject = await ProjectModel.findOne({ _id: projectId });
        if (!currentProject) {
            return res.status(400).json({ message: "Project doesn't exist" });
        }

        const newTask = await TaskModel.create({
            name: name,
            deadline: deadline,
            description: description,
            priority: priority,
        });
        await newTask.save();
        await ProjectModel.findByIdAndUpdate(projectId, {
            $addToSet: {
                childTasks: newTask._id,
            },
        });
        // Add api call for aws server for creating sub task
        // await generateSubTasks(newTask);
        return res
            .status(200)
            .json({ data: newTask._id, message: "Task added successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addSubTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const name = req.body.name;
        const deadline = req.body.deadline || new Date();
        const description = req.body.description;
        const taskId = req.body.taskId;
        const priority = req.body.priority || priorityMap.LOW;
        const fileName = req.file?.filename || "";

        if (
            !isValidObjectId(taskId) ||
            !name ||
            name.length == 0 ||
            !description ||
            description.length == 0
        ) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        const currentTask = await TaskModel.findOne({ _id: taskId });
        if (!currentTask) {
            return res.status(400).json({ message: "Task doesn't exist" });
        }

        const newSubTask = await SubtaskModel.create({
            name: name,
            deadline: deadline,
            description: description,
            priority: priority,
            document: fileName,
            predictedDeadline: deadline,
        });
        await newSubTask.save();
        await TaskModel.findByIdAndUpdate(taskId, {
            $addToSet: {
                childTasks: newSubTask._id,
            },
        });

        return res.status(200).json({ message: "Sub task added successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Verify if it works fine
export const allocateSubTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const userId = req.body.userId;
        const subTaskId = req.body.subTaskId;
        if (!isValidObjectId(userId) || !isValidObjectId(subTaskId)) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        const checkUser = await UserModel.findOne({
            _id: userId,
        });
        if (!checkUser) {
            return res
                .status(400)
                .json({ message: "Requested user doesn't exist" });
        }

        const addUserToSubTask = await SubtaskModel.findByIdAndUpdate(
            subTaskId,
            {
                $set: { allotedUsers: userId },
            }
        );
        if (!addUserToSubTask) {
            return res.status(400).json({ message: "Subtask doesn't exist" });
        }
        await UserModel.findByIdAndUpdate(userId, {
            $addToSet: { allotedTasks: subTaskId },
        });

        return res
            .status(200)
            .json({ message: "Subtask allocated successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ToDo: Verify if pull operation works fine
export const deallocateSubTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const userId = req.body.userId;
        const subTaskId = req.body.subTaskId;
        if (!isValidObjectId(userId) || !isValidObjectId(subTaskId)) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        const checkUser = await UserModel.findOne({
            _id: userId,
        });
        if (!checkUser) {
            return res
                .status(400)
                .json({ message: "Requested user doesn't exist" });
        }

        const removeUserFromSubTask = await SubtaskModel.findByIdAndUpdate(
            subTaskId,
            {
                $unset: { allotedUsers: userId },
            }
        );
        if (!removeUserFromSubTask) {
            return res.status(400).json({ message: "Subtask doesn't exist" });
        }

        await UserModel.findByIdAndUpdate(userId, {
            $pull: { allotedTasks: subTaskId },
        });

        return res
            .status(200)
            .json({ message: "Task de-allocated successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const removeProject = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const projectId = req.body.projectId;
        if (!isValidObjectId(projectId)) {
            return res.status(400).json({ message: "Invalid parameters" });
        }
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(400).json({ message: "Project doesn't exist" });
        }

        await Promise.all(
            project.childTasks.map(async (taskId) => {
                const task = await TaskModel.findById(taskId);
                if (task) {
                    await Promise.all(
                        task.childTasks.map(async (subTaskId) => {
                            const subTask =
                                await SubtaskModel.findById(subTaskId);
                            if (subTask) {
                                if (isValidObjectId(subTask.allotedUsers)) {
                                    await UserModel.findByIdAndUpdate(
                                        subTask.allotedUsers,
                                        {
                                            $pull: {
                                                allotedTasks: subTaskId,
                                            },
                                        }
                                    );
                                }
                            }
                            return await SubtaskModel.findByIdAndDelete(
                                subTaskId
                            );
                        })
                    );
                    return await TaskModel.findByIdAndDelete(taskId);
                }
            })
        );

        const deleteProject = await ProjectModel.findByIdAndDelete(projectId);
        return res
            .status(200)
            .json({ message: "Project removed successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const removeTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const projectId = req.body.projectId;
        const taskId = req.body.taskId;
        if (!isValidObjectId(projectId) || !isValidObjectId(taskId)) {
            return res.status(400).json({ message: "Invalid parameters" });
        }
        const task = await TaskModel.findById(taskId);
        if (!task) {
            return res.status(400).json({ message: "Task doesn't exist" });
        }

        await Promise.all(
            task.childTasks.map(async (subTaskId) => {
                const subTask = await SubtaskModel.findById(subTaskId);
                if (subTask) {
                    if (isValidObjectId(subTask.allotedUsers)) {
                        await UserModel.findByIdAndUpdate(
                            subTask.allotedUsers,
                            {
                                $pull: {
                                    allotedTasks: subTaskId,
                                },
                            }
                        );
                    }
                    return await SubtaskModel.findByIdAndDelete(subTaskId);
                }
            })
        );

        const updatedProject = await ProjectModel.findByIdAndUpdate(projectId, {
            $pull: { childTasks: taskId },
        });

        if (!updatedProject) {
            return res.status(400).json({ message: "Project doesn't exist" });
        }

        const deleteTask = await TaskModel.findByIdAndDelete(taskId);
        return res.status(200).json({ message: "Task removed successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const removeSubTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const subTaskId = req.body.subTaskId;
        const taskId = req.body.taskId;
        if (!isValidObjectId(subTaskId) || !isValidObjectId(taskId)) {
            return res.status(400).json({ message: "Invalid parameters" });
        }
        const subTask = await SubtaskModel.findById(subTaskId);
        if (!subTask) {
            return res.status(400).json({ message: "Subtask doesn't exist" });
        }
        if (isValidObjectId(subTask.allotedUsers)) {
            await UserModel.findByIdAndUpdate(subTask.allotedUsers, {
                $pull: {
                    allotedTasks: subTask._id,
                },
            });
        }
        const updatedParentTask = await TaskModel.findByIdAndUpdate(taskId, {
            $pull: { childTasks: subTaskId },
        });

        if (!updatedParentTask) {
            return res
                .status(400)
                .json({ message: "Parent task doesn't exist" });
        }

        const deleteSubTask = await SubtaskModel.findByIdAndDelete(subTaskId);
        return res
            .status(200)
            .json({ message: "Sub task removed successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCurrentAdmin = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        return res.status(200).json({ data: admin });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const editProject = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const projectName = req.body.name;
        const descriptiion = req.body.description;
        const deadline = req.body.deadline || (new Date() as Date);
        const projectId = req.body.projectId;
        const status = req.body.status || statusMap.TODO;
        const priority = req.body.priority || priorityMap.LOW;
        if (!isValidObjectId(projectId)) {
            return res.status(400).json({ message: "Invalid params" });
        }

        const newUpdatedProject = await ProjectModel.findOneAndUpdate(
            { _id: projectId },
            {
                name: projectName,
                deadline: deadline,
                status: status,
                priority: priority,
                description: descriptiion,
            }
        );
        if (!newUpdatedProject) {
            return res
                .status(400)
                .json({ message: "Requested project doesn't exist" });
        }
        return res.status(200).json({ message: "Project edited successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const editTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const taskName = req.body.name;
        const deadline = req.body.deadline || (new Date() as Date);
        const taskId = req.body.taskId;
        const status = req.body.status || statusMap.TODO;
        const priority = req.body.priority || priorityMap.LOW;
        const description = req.body.description;
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: "Invalid params" });
        }

        const newUpdatedTask = await TaskModel.findOneAndUpdate(
            { _id: taskId },
            {
                name: taskName,
                deadline: deadline,
                status: status,
                priority: priority,
                description: description,
            }
        );
        if (!newUpdatedTask) {
            return res
                .status(400)
                .json({ message: "Requested task doesn't exist" });
        }
        return res.status(200).json({ message: "Task edited successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const editSubtask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const subtaskName = req.body.name;
        const deadline = req.body.deadline || (new Date() as Date);
        const subtaskId = req.body.subtaskId;
        const status = req.body.status || statusMap.TODO;
        const priority = req.body.priority || priorityMap.LOW;
        const fileName = req.file?.filename || "";
        const description = req.body.description;
        if (!isValidObjectId(subtaskId)) {
            return res.status(400).json({ message: "Invalid params" });
        }
        const updateQuery: any = {
            name: subtaskName,
            deadline: deadline,
            status: status,
            priority: priority,
            description: description,
        };
        if (req.body.isFileUpdated == "true") {
            updateQuery.document = fileName;
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

export const getAllProjects = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
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
        const finalData = data.filter((val) => val != undefined && val != null);
        return res.status(200).json({ data: finalData });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getTasksOfProject = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
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
        const taskData = data.filter((val) => val != undefined && val != null);
        const finalData = {
            projectName: project.name,
            projectId: project._id,
            tasks: taskData,
        };
        return res.status(200).json({ data: finalData });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getSubTasksOfTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
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
        const subTaskData = data.filter(
            (val) => val != undefined && val != null
        );
        const finalData = {
            projectName: project.name,
            projectId: project._id,
            taskName: task.name,
            taskId: task._id,
            subTasks: subTaskData,
        };
        return res.status(200).json({ data: finalData });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUserProfile = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const gender = req.body.gender;
        const role = req.body.role;
        const salary = req.body.salary;
        const position = req.body.position;
        const absences = req.body.absences;
        const joiningDate = req.body.joiningDate;
        const currentRating = req.body.currentRating;
        const moral = req.body.moral;
        const userId = req.body.userId;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid params" });
        }
        const updatedUser = await UserModel.findByIdAndUpdate(userId, {
            gender: gender,
            role: role,
            salary: salary,
            position: position,
            absences: absences,
            joiningDate: joiningDate,
            currentRating: currentRating,
            moral: moral,
        });
        if (!updatedUser) {
            return res.status(400).json({ message: "User doesn't exist" });
        }
        return res.status(200).json({ message: "User updated succesfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getUser = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const userId = req.body.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid params" });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }
        return res.status(200).json({ data: user });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const fetchAllUsers = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const users = await UserModel.find({});
        const data = users.map((user) => {
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                gender: user.gender,
                age: user.age,
                isMarried: user.isMarried,
                role: user.role,
                salary: user.salary,
                position: user.position,
                absences: user.absences,
                meanMonthlyHours: user.meanMonthlyHours,
                joiningDate: user.joiningDate,
                currentRating: user.currentRating, // 0-10 (given by admin)
                moral: user.moral, // given by admin
                stressBurnoutScore: user.stressBurnoutScore, // ML model
            };
        });
        return res.status(200).json({ data: data });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const generateSubTasks = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const taskId = req.body.taskId;
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({
                message: "Invalid task found while generating subtasks",
            });
        }
        const task = await TaskModel.findById(taskId);
        if (!task) {
            return res
                .status(400)
                .json({ message: "Task not found while generating subtasks" });
        }
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/decompose_allocate_task",
            data: { task: task.description },
        });
        if (response.status === 200) {
            const allocations = response.data.allocations;
            const subtaskIds = await Promise.all(
                allocations.map(
                    async (entry: {
                        allotedUser: any;
                        name: any;
                        Description: any;
                    }) => {
                        const allotedUser = await UserModel.findOne({
                            name: entry.allotedUser,
                        });
                        if (allotedUser) {
                            const newSubTask = await SubtaskModel.create({
                                name: entry.name,
                                description: entry.Description,
                                allotedUsers: allotedUser._id,
                            });
                            await newSubTask.save();
                            await UserModel.findOneAndUpdate(
                                { _id: allotedUser._id },
                                {
                                    $push: {
                                        allotedTasks: newSubTask._id,
                                    },
                                    $inc: {
                                        projectsOngoing: 1,
                                    },
                                }
                            );
                            await TaskModel.findByIdAndUpdate(taskId, {
                                $addToSet: {
                                    childTasks: newSubTask._id,
                                },
                            });
                            return {
                                subTaskId: newSubTask._id,
                                userId: allotedUser._id,
                            };
                        }
                    }
                )
            );
            const data = subtaskIds.filter(
                (val) => val != undefined && val != null
            );
            await Promise.all(
                data.map(async (entry) => {
                    await getStressScore(entry.userId);
                    await getMoralScore(entry.userId);
                    await predictCompletionTime(entry.userId, entry.subTaskId);
                })
            );
            // await getEmployeeReview()
        }
    } catch (e) {
        console.error(e);
        return;
    }
};

const getStressScore = async (id: String) => {
    try {
        if (!isValidObjectId(id)) {
            console.error("Id is not a valid employee id");
            return;
        }
        const user = await UserModel.findById(id);
        if (!user) {
            console.error("User not found");
            return;
        }
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/predict_stress_score",
            data: { name: user.name },
        });
        if (response.status === 200) {
            const score = response.data;
            await UserModel.findByIdAndUpdate(id, {
                stressBurnoutScore: parseInt(score),
            });
        }
        return;
    } catch (e) {
        console.error(e);
        return;
    }
};

const getMoralScore = async (id: String) => {
    try {
        if (!isValidObjectId(id)) {
            console.error("Id is not a valid employee id");
            return;
        }
        const user = await UserModel.findById(id);
        if (!user) {
            console.error("User not found");
            return;
        }
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/predict_moral_score",
            data: { name: user.name },
        });
        if (response.status === 200) {
            const score = response.data;
            await UserModel.findByIdAndUpdate(id, { moral: score });
        }
        return;
    } catch (e) {
        console.error(e);
        return;
    }
};

const predictCompletionTime = async (id: String, subTaskId: String) => {
    try {
        if (!isValidObjectId(id) || !isValidObjectId(subTaskId)) {
            console.error("Id is not a valid subtask id");
            return;
        }
        const subtask = await SubtaskModel.findById(subTaskId);
        if (!subtask) {
            console.error("Subtask not found");
            return;
        }
        const user = await UserModel.findById(id);
        if (!user) {
            console.error("User not found");
            return;
        }

        const data = {
            "Employee Name": user.name,
            Gender: user.gender,
            Age: user.age,
            Married: user.isMarried ? "Married" : "Bachelor",
            Role: user.role,
            Salary: user.salary,
            Position: user.position,
            Absences: user.absences,
            Projects_Completed: user.completedProjects,
            "Mean Monthly Hours": user.meanMonthlyHours,
            "Years in the company": new Number(
                (new Date().getTime() - new Date(user.joiningDate).getTime()) /
                    31536000000
            ).toFixed(0),
            Joining_Year: new Date(user.joiningDate),
            Current_Employ_Rating: user.currentRating,
            Moral: user.moral,
            "Stress & Burnout Score": user.stressBurnoutScore,
            Ongoing_Project_Count: user.projectsOngoing,
            Projects_Within_Deadline: user.projectsWithinDeadline,
            Project_Description: subtask.description,
            Project_Difficulty:
                subtask.priority == priorityMap.LOW
                    ? "Low"
                    : subtask.priority == priorityMap.MEDIUM
                      ? "Medium"
                      : "High",
            Project_Deadline: new Date(subtask.deadline || new Date()),
        };
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/predict_completion_time",
            data: { name: user.name, data: data },
        });
        if (response.status === 200) {
            const numberOfDays = parseInt(response.data);
            const startDateTime = subtask.startDate;
            const startDate = new Date(startDateTime);
            const newDeadline = new Date(startDate);
            newDeadline.setDate(newDeadline.getDate() + numberOfDays);
            const x = await SubtaskModel.findByIdAndUpdate(
                subTaskId,
                {
                    predictedDeadline: new Date(
                        newDeadline.toISOString().split("T")[0]
                    ),
                    deadline: newDeadline,
                },
                { new: true }
            );
        }
        return;
    } catch (e) {
        console.error(e);
        return;
    }
};

export const generateChat = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const points = req.body.query;
        const response = await axios({
            method: "post",
            url: config.noteBookUrl + "/chat",
            data: { query: points },
        });
        if (response.status == 200) {
            return res.status(200).json(response.data.response);
        } else {
            return res
                .status(400)
                .json({ message: "Error occured while generating" });
        }
    } catch {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const writeEmail = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
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
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
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
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
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
