/*
Task Allocation.
Task Completion Time. 
Stress & Burnout
*/

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
        const addUserToTask = await TaskModel.findByIdAndUpdate(taskId, {
            $addToSet: { allotedUsers: userId },
        });
        if (!addUserToTask) {
            return res
                .status(400)
                .json({ message: "Selected task is not created" });
        }
        await UserModel.findByIdAndUpdate(userId, {
            $addToSet: { allotedTasks: taskId },
        });
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
        const newTask = await TaskModel.create({
            name: taskName,
            deadline: deadline,
        });
        await newTask.save();
        return res.status(200).json({ message: "Task created successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};
