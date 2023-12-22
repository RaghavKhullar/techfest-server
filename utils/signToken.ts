import { sign } from "jsonwebtoken";

export const signToken = (email: string, id: string, isAdmin: boolean) => {
    return sign(
        { email: email, id: id, isAdmin: isAdmin },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "24h",
            algorithm: "HS256",
        }
    );
};
