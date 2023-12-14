import UserModel from "../models/user/user.model";
import { signToken } from "../utils/cookieValidator";
import { getTokensGoogle, getGoogleUser } from "../utils/googleAuthHandler";

export const userLogin = async (req: any, res: any) => {
    const code = req.query.code;
    try {
        const { id_token, access_token } = await getTokensGoogle(code);
        if (id_token === undefined || access_token === undefined) {
            return res.redirect(`${process.env.FRONTEND_URL}/login`);
        }

        const userDetails = await getGoogleUser(id_token, access_token);
        const currentUser = await UserModel.findOne({
            email: userDetails.email,
        });
        if (!currentUser) {
            const newUser = await UserModel.create({
                email: userDetails.email,
                name: userDetails.name,
            });
            await newUser.save();
            res.cookie("token", signToken(userDetails.email, newUser._id), {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            });
        } else {
            res.cookie("token", signToken(userDetails.email, currentUser._id), {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            });
        }

        return res.redirect(`${process.env.FRONTEND_URL}/home`);
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
