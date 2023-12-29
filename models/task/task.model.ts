import { Schema, model, Document, Types } from "mongoose";

export interface TaskInterface extends Document {
    name: string;
    deadline: Date;
    childTasks: Array<Types.ObjectId>;
    description: string;
    status: string;
    priority: number;
}

export const statusMap = {
    TODO: "todo",
    PROGRESS: "progress",
    COMPLETE: "complete",
};

export const priorityMap = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
};

const TaskSchema = new Schema<TaskInterface>(
    {
        name: {
            type: String,
            default: "",
        },
        deadline: {
            type: Date,
            default: null,
        },
        childTasks: {
            type: [Types.ObjectId],
            default: [],
            ref: "SubtaskModel",
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
    },
    { timestamps: true }
);

const TaskModel = model<TaskInterface>("TaskModel", TaskSchema);

export default TaskModel;
