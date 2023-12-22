import { Schema, model, Document, Types } from "mongoose";

interface UserInterface extends Document {
    name: string;
    email: string;
    allotedTasks: Array<Types.ObjectId>;
    image: string;
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
    allotedTasks: {
        type: [Types.ObjectId],
        default: [],
        ref: "SubtaskModel",
    },
    image: {
        type: String,
        default: "",
    },
});

const UserModel = model<UserInterface>("UserModel", UserSchema);

export default UserModel;
