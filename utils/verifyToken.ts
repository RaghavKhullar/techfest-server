import { verify } from "jsonwebtoken";
import { isValidObjectId } from "mongoose";

export const authenticateUserToken = (req: any, res: any, next: any) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send("Authorization failed. No access token.");
    }

    verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
        if (
            err ||
            (user && (!user.email || user.isAdmin || !isValidObjectId(user.id)))
        ) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        req.userId = user.id;
        next();
    });
};

export const authenticateTokenAdmin = (req: any, res: any, next: any) => {
    const token = req.cookies?.idToken;

    if (!token) {
        return res.status(401).send("Authorization failed. No access token.");
    }

    verify(token, process.env.JWT_SECRET as string, (err: any, admin: any) => {
        if (
            err ||
            (admin &&
                (!admin.email || !admin.isAdmin || !isValidObjectId(admin.id)))
        ) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        req.adminId = admin.id;
        next();
    });
};
