import { Schema, model, Document } from "mongoose";

interface AdminInterface extends Document {
    name: string;
    email: string;
}

const AdminSchema = new Schema<AdminInterface>({
    name: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
});

const AdminModel = model<AdminInterface>("AdminModel", AdminSchema);

export default AdminModel;
