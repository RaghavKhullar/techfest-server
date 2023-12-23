import { Schema, model, Document, Types } from "mongoose";
import { priorityMap, statusMap } from "./task.model";

interface ProjectInterface extends Document {
    name: string;
    deadline: Date;
    childTasks: Array<Types.ObjectId>;
    status: string;
    description: string;
    priority: number;
}

const ProjectSchema = new Schema<ProjectInterface>(
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
            ref: "TaskModel",
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

const ProjectModel = model<ProjectInterface>("ProjectModel", ProjectSchema);

export default ProjectModel;
