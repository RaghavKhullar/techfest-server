import { verify } from "jsonwebtoken";

export const authenticateUserToken = (req: any, res: any, next: any) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send("Authorization failed. No access token.");
    }

    verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
        if (err || (user && (!user.email || user.isAdmin))) {
            return res
                .cookie("token", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        req.userEmail = user.email;
        next();
    });
};

export const authenticateTokenAdmin = (req: any, res: any, next: any) => {
    const token = req.cookies?.idToken;

    if (!token) {
        return res.status(401).send("Authorization failed. No access token.");
    }

    verify(token, process.env.JWT_SECRET as string, (err: any, admin: any) => {
        if (err || (admin && (!admin.email || !admin.isAdmin))) {
            return res
                .cookie("idToken", "", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                })
                .redirect(`${process.env.FRONTEND_URL}/login`);
        }
        req.adminEmail = admin.email;
        next();
    });
};
