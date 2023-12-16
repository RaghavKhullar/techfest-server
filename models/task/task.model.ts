import { Schema, model, Document, Types } from "mongoose";

interface TaskInterface extends Document {
    name: string;
    allotedUsers: Array<Types.ObjectId>;
    deadline: Date;
    childTasks: Array<Types.ObjectId>;
}

const TaskSchema = new Schema<TaskInterface>(
    {
        name: {
            type: String,
            default: "",
        },
        allotedUsers: {
            type: [Types.ObjectId],
            default: [],
            ref: "UserModel",
        },
        deadline: {
            type: Date,
            default: null,
        },
        childTasks: {
            type: [Types.ObjectId],
            default: [],
            ref: "TaskModel",
        },
    },
    { timestamps: true }
);

const TaskModel = model<TaskInterface>("TaskModel", TaskSchema);

export default TaskModel;
