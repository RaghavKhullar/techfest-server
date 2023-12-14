import { sign } from "jsonwebtoken";

export const signToken = (email: string, id: string) => {
    return sign(
        { email: email, object: id },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "24h",
            algorithm: "HS256",
        }
    );
};
