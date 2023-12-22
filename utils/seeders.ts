import dotenv from "dotenv";
import config from "../config/config";
dotenv.config({
    path: __dirname.replace("build", ".env"),
});
import ProjectModel from "../models/task/project.model";
import connectDatabase from "../utils/connectDatabase";
import TaskModel from "../models/task/task.model";
import SubtaskModel from "../models/task/subtask.model";

const dateEntries = [
    new Date("January 15, 2023"),
    new Date("February 28, 2022"),
    new Date("March 10, 2023"),
    new Date("April 5, 2022"),
    new Date("May 20, 2023"),
    new Date("June 8, 2022"),
    new Date("July 12, 2023"),
    new Date("August 3, 2022"),
    new Date("September 18, 2023"),
    new Date("October 22, 2022"),
];

const seeder = async () => {
    connectDatabase(config.db, "mongodb://localhost:27017/");

    const data = await Promise.all(
        dateEntries.map(async (entry, i) => {
            const newEntry = await ProjectModel.create({
                deadline: entry,
                name: "Project " + i,
            });
            await newEntry.save();
            return newEntry;
        })
    );
    console.log(data, data.length);
    return;
};

// seeder();

const dateEntries2 = [
    new Date("January 5, 2023"),
    new Date("February 18, 2022"),
    new Date("March 7, 2023"),
    new Date("April 22, 2022"),
    new Date("May 11, 2023"),
    new Date("June 3, 2022"),
    new Date("July 15, 2023"),
    new Date("August 9, 2022"),
    new Date("September 28, 2023"),
    new Date("October 14, 2022"),
    new Date("November 2, 2023"),
    new Date("December 20, 2022"),
    new Date("January 17, 2023"),
    new Date("February 8, 2022"),
    new Date("March 19, 2023"),
    new Date("April 14, 2022"),
    new Date("May 26, 2023"),
    new Date("June 12, 2022"),
    new Date("July 22, 2023"),
    new Date("August 5, 2022"),
];

const seeder2 = async () => {
    connectDatabase(config.db, "mongodb://localhost:27017/");
    const projects = await ProjectModel.find();
    const data = await Promise.all(
        dateEntries2.map(async (entry, i) => {
            const newEntry = await TaskModel.create({
                deadline: entry,
                name: "Task " + i,
            });
            await newEntry.save();
            const updatedProject = await ProjectModel.findByIdAndUpdate(
                projects[Math.floor(Math.random() * dateEntries.length)]._id,
                { $addToSet: { childTasks: newEntry._id } }
            );
            return newEntry;
        })
    );
    console.log(data, data.length);
    return;
};

// seeder2();
const dateEntries3 = [
    new Date("January 5, 2023"),
    new Date("February 18, 2022"),
    new Date("March 7, 2023"),
    new Date("April 22, 2022"),
    new Date("May 11, 2023"),
    new Date("June 3, 2022"),
    new Date("July 15, 2023"),
    new Date("August 9, 2022"),
    new Date("September 28, 2023"),
    new Date("October 14, 2022"),
    new Date("November 2, 2023"),
    new Date("December 20, 2022"),
    new Date("January 17, 2023"),
    new Date("February 8, 2022"),
    new Date("March 19, 2023"),
    new Date("April 14, 2022"),
    new Date("May 26, 2023"),
    new Date("June 12, 2022"),
    new Date("July 22, 2023"),
    new Date("August 5, 2022"),
    new Date("September 10, 2023"),
    new Date("October 29, 2022"),
    new Date("November 15, 2023"),
    new Date("December 1, 2022"),
    new Date("January 23, 2023"),
    new Date("February 14, 2022"),
    new Date("March 27, 2023"),
    new Date("April 30, 2022"),
    new Date("May 7, 2023"),
    new Date("June 18, 2022"),
    new Date("July 28, 2023"),
    new Date("August 15, 2022"),
    new Date("September 5, 2023"),
    new Date("October 19, 2022"),
    new Date("November 9, 2023"),
    new Date("December 25, 2022"),
    new Date("January 31, 2023"),
    new Date("February 22, 2022"),
];
const seeder3 = async () => {
    connectDatabase(config.db, "mongodb://localhost:27017/");
    const tasks = await TaskModel.find();
    const data = await Promise.all(
        dateEntries3.map(async (entry, i) => {
            const newEntry = await SubtaskModel.create({
                deadline: entry,
                name: "SubTask " + (i + 40),
            });
            await newEntry.save();
            const updatedTask = await TaskModel.findByIdAndUpdate(
                tasks[Math.floor(Math.random() * dateEntries2.length)]._id,
                { $addToSet: { childTasks: newEntry._id } }
            );
            return newEntry;
        })
    );
    console.log(data, data.length);
    return;
};

// seeder3();
