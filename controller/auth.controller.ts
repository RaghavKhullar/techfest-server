import AdminModel from "../models/user/admin.model";
import AllowedUserModel from "../models/user/allowedUser.model";
import UserModel from "../models/user/user.model";
import { signToken } from "../utils/signToken";
import { getTokensGoogle, getGoogleUser } from "../utils/googleAuthHandler";
import { isValidObjectId } from "mongoose";

export const userLogin = async (req: any, res: any) => {
    const code = req.query.code;
    try {
        const { id_token, access_token } = await getTokensGoogle(code, false);
        if (id_token === undefined || access_token === undefined) {
            return res.redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const userDetails = await getGoogleUser(id_token, access_token);
        const checkUserExist = await AllowedUserModel.findOne({
            email: userDetails.email,
            isAdmin: false,
        });
        if (!checkUserExist) {
            return res.status(400).json({
                message:
                    "You are not authorised to access the website. Contact the admin to allow",
            });
        }

        const currentUser = await UserModel.findOneAndUpdate(
            {
                email: userDetails.email,
            },
            { email: userDetails.email },
            { new: true, upsert: true }
        );

        res.cookie(
            "token",
            signToken(userDetails.email, currentUser._id, false),
            {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            }
        );

        return res.redirect(`${process.env.FRONTEND_URL}/user/allotedSubtasks`);
    } catch (err: any) {
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
};

export const userLogout = (req: any, res: any) => {
    return res
        .cookie("token", "", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        })
        .status(200)
        .json({ message: "Logged out" });
};

export const adminLogin = async (req: any, res: any) => {
    const code = req.query.code;
    try {
        const { id_token, access_token } = await getTokensGoogle(code, true);
        if (id_token === undefined || access_token === undefined) {
            return res.redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const adminDetails = await getGoogleUser(id_token, access_token);
        const checkAdminExist = await AllowedUserModel.findOne({
            email: adminDetails.email,
            isAdmin: true,
        });
        if (!checkAdminExist) {
            return res.status(400).json({
                message:
                    "You are not authorised to access the website. Contact the admin to allow",
            });
        }

        const currentAdmin = await AdminModel.findOneAndUpdate(
            {
                email: adminDetails.email,
            },
            { email: adminDetails.email, name: adminDetails.name },
            { new: true, upsert: true }
        );

        res.cookie(
            "idToken",
            signToken(adminDetails.email, currentAdmin._id, true),
            {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            }
        );
        return res.redirect(`${process.env.FRONTEND_URL}/admin/viewProject`);
    } catch (err: any) {
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
};

export const adminLogout = (req: any, res: any) => {
    return res
        .cookie("idToken", "", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        })
        .status(200)
        .json({ message: "Logged out" });
};

export const getUserDetailsForReview = async (req: any, res: any) => {
    try {
        const userId = req.body.userId;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid params" });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        return res.status(200).json({
            data: {
                id: user.id,
                name: user.name,
                image: user.image,
                email: user.email,
                role: user.role,
                position: user.position,
                gender: user.gender,
                age: user.age,
                isMarried: user.isMarried,
                salary: user.salary,
                absences: user.absences,
                meanMonthlyHours: user.meanMonthlyHours,
                joiningDate: user.joiningDate,
                currentRating: user.currentRating,
                moral: user.moral,
                stressBurnoutScore: user.stressBurnoutScore,
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
};
