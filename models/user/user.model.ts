import { Schema, model, Document } from "mongoose";

interface UserInterface extends Document {
    name: string;
    email: string;
}

const UserSchema = new Schema<UserInterface>({
    name: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
});

const UserModel = model<UserInterface>("UserModel", UserSchema);

export default UserModel;
