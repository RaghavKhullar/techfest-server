import { Schema, model, Document, Types, ObjectId } from "mongoose";
import { priorityMap, statusMap } from "./task.model";
interface SubtaskInterface extends Document {
    name: string;
    allotedUsers: ObjectId;
    deadline: Date;
    status: string;
    description: string;
    priority: number;
    document: string;
    userDocument: string;
    startDate: Date;
    predictedDeadline: Date;
}

const SubtaskSchema = new Schema<SubtaskInterface>(
    {
        name: {
            type: String,
            default: "",
        },
        allotedUsers: {
            type: Types.ObjectId,
            ref: "UserModel",
        },
        deadline: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            default: statusMap.TODO,
        },
        description: {
            type: String,
            default: "",
        },
        priority: {
            type: Number,
            default: priorityMap.LOW,
        },
        document: {
            type: String,
            default: "",
        },
        userDocument: {
            type: String,
            default: "",
        },
        startDate: {
            type: Date,
            default: new Date(),
        },
        predictedDeadline: {
            type: Date,
            default: new Date(),
        },
    },
    { timestamps: true }
);

const SubtaskModel = model<SubtaskInterface>("SubtaskModel", SubtaskSchema);

export default SubtaskModel;
