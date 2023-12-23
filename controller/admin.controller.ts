import TaskModel, { priorityMap, statusMap } from "../models/task/task.model";
import AdminModel from "../models/user/admin.model";
import AllowedUserModel from "../models/user/allowedUser.model";
import UserModel from "../models/user/user.model";
import ProjectModel from "../models/task/project.model";
import SubtaskModel from "../models/task/subtask.model";
import { isValidObjectId } from "mongoose";

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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
        }

        const email = req.body.email;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid user email" });
        }

        await AllowedUserModel.findOneAndUpdate(
            { email: email, isAdmin: false },
            { email: email, isAdmin: false },
            { upsert: true, new: true }
        );
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
            descriptiion: description,
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
        }

        const taskName = req.body.name;
        const deadline = req.body.deadline || (new Date() as Date);
        const taskId = req.body.taskId;
        const status = req.body.status || statusMap.TODO;
        const priority = req.body.priority || priorityMap.LOW;
        const description = req.body.descriptiion;
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
        }

        const subtaskName = req.body.name;
        const deadline = req.body.deadline || (new Date() as Date);
        const subtaskId = req.body.subtaskId;
        const status = req.body.status || statusMap.TODO;
        const priority = req.body.priority || priorityMap.LOW;
        const fileName = req.file?.filename || "";
        const description = req.body.descriptiion;
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
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
        const admin = await AdminModel.findById(req.adminId);
        if (!admin) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/admin/login`);
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
