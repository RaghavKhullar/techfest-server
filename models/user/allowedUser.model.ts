import { Schema, model, Document } from "mongoose";

interface AllowedUserInterface extends Document {
    email: string;
    isAdmin: boolean;
}

const AllowedUserSchema = new Schema<AllowedUserInterface>({
    email: {
        type: String,
        default: "",
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
});

const AllowedUserModel = model<AllowedUserInterface>(
    "AllowedUserModel",
    AllowedUserSchema
);

export default AllowedUserModel;
