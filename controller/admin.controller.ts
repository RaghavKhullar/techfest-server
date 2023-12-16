import { Types } from "mongoose";
import TaskModel from "../models/task/task.model";
import AdminModel from "../models/user/admin.model";
import AllowedUserModel from "../models/user/allowedUser.model";
import UserModel from "../models/user/user.model";

const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@gmail\.com$/);

export const addUser = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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
        const admin = await AdminModel.findById(req.userId);
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

// Verify if it works fine
export const allocateTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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
        const userId = req.body.userId;
        const taskId = req.body.taskId;
        if (!userId || !taskId || userId.length == 0 || taskId.length == 0) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid user email" });
        }

        const checkUser = await UserModel.findOne({
            email: email,
            _id: userId,
        });
        if (!checkUser) {
            return res
                .status(400)
                .json({ message: "Requested user doesn't exist" });
        }

        const queue = [taskId];

        for (; queue.length > 0; ) {
            const front = queue[0];
            queue.shift();
            const addUserToTask = await TaskModel.findByIdAndUpdate(front, {
                $addToSet: { allotedUsers: userId },
            });
            if (!addUserToTask) {
                continue;
            }
            addUserToTask.childTasks.forEach((task) => queue.push(task));
            await UserModel.findByIdAndUpdate(userId, {
                $addToSet: { allotedTasks: front },
            });
        }

        return res.status(200).json({ message: "Task allocated successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ToDo: Verify if pull operation works fine
export const deallocateTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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
        const userId = req.body.userId;
        const taskId = req.body.taskId;
        if (!userId || !taskId || userId.length == 0 || taskId.length == 0) {
            return res.status(400).json({ message: "Invalid parameters" });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid user email" });
        }

        const checkUser = await UserModel.findOne({
            email: email,
            _id: userId,
        });
        if (!checkUser) {
            return res
                .status(400)
                .json({ message: "Requested user doesn't exist" });
        }

        const queue = [taskId];

        for (; queue.length > 0; ) {
            const front = queue[0];
            queue.shift();
            const addUserToTask = await TaskModel.findByIdAndUpdate(front, {
                $pull: { allotedUsers: userId },
            });
            if (!addUserToTask) {
                continue;
            }
            addUserToTask.childTasks.forEach((task) => queue.push(task));
            await UserModel.findByIdAndUpdate(userId, {
                $pull: { allotedTasks: front },
            });
        }

        return res.status(200).json({ message: "Task allocated successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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

        const taskName = req.body.taskName;
        const deadline = req.body.deadline as Date;
        const parentTaskId = req.body.parentTaskId || null;

        if (!taskName || taskName.length == 0) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        let parentTaskAllotedUsers: Types.ObjectId[] = [];
        if (parentTaskId) {
            const parentTask = await TaskModel.findById(parentTaskId);
            if (!parentTask) {
                return res.status(400).json({ message: "No such task exists" });
            }
            parentTaskAllotedUsers = parentTask.allotedUsers;
        }
        const newTask = await TaskModel.create({
            name: taskName,
            deadline: deadline,
            allotedUsers: parentTaskAllotedUsers,
        });
        await newTask.save();

        // Add this newly created child task to all the allotedTasks of the parent users
        await Promise.all(
            parentTaskAllotedUsers.map(async (users) => {
                return await UserModel.findOneAndUpdate(users, {
                    $addToSet: { allotedTasks: newTask._id },
                });
            })
        );

        return res.status(200).json({ message: "Task created successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const removeChildTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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

        const taskId = req.body.taskId || null;
        const parentTaskId = req.body.parentTaskId || null;
        if (
            !parentTaskId ||
            parentTaskId.length == 0 ||
            !taskId ||
            taskId.length == 0
        ) {
            return res.status(400).json({ message: "Invalid parameters" });
        }
        const childTask = await TaskModel.findById(taskId);
        if (!childTask) {
            return res
                .status(400)
                .json({ message: "Requested task doesn't exist" });
        }

        const updatedParentTask = await TaskModel.findByIdAndUpdate(
            parentTaskId,
            { $pull: { childTasks: taskId } }
        );

        if (!updatedParentTask) {
            return res
                .status(400)
                .json({ message: "Parent task doesn't exist" });
        }
        return res
            .status(200)
            .json({ message: "Child task removed successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCurrentAdmin = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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

export const editTask = async (req: any, res: any) => {
    try {
        const admin = await AdminModel.findById(req.userId);
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

        const taskName = req.body.taskName;
        const deadline = req.body.deadline as Date;
        const taskId = req.body.taskId;

        const newUpdatedTask = await TaskModel.findOneAndUpdate(
            { _id: taskId },
            { name: taskName, deadline: deadline }
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
