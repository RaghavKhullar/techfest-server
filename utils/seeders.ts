import dotenv from "dotenv";
import config from "../config/config";
dotenv.config({
    path: __dirname.replace("build", ".env"),
});
import ProjectModel from "../models/task/project.model";
import connectDatabase from "../utils/connectDatabase";
import TaskModel, { statusMap } from "../models/task/task.model";
import SubtaskModel from "../models/task/subtask.model";
import UserModel from "../models/user/user.model";
import fs from "fs";
import csv from "csv-parser";
import AllowedUserModel from "../models/user/allowedUser.model";
import { readFile } from "fs/promises";
async function readCsvFile(filePath: string) {
    try {
        // Read the CSV file
        const fileContent = await readFile(filePath, "utf-8");

        // Parse the CSV data
        const results = await new Promise((resolve, reject) => {
            const rows: any = [];
            const parser = csv();

            parser
                .on("data", (data) => {
                    // Process each row of data
                    rows.push(data);
                })
                .on("end", () => {
                    // All rows have been read
                    resolve(rows);
                })
                .on("error", (error) => {
                    reject(error);
                });

            // Feed the CSV content to the parser
            parser.write(fileContent);
            parser.end();
        });

        return results;
    } catch (error: any) {
        console.error("Error reading CSV file:", error.message);
        throw error;
    }
}

// Example: Read and parse a CSV file using async/await

const updateDbUser = async () => {
    await connectDatabase(config.db, "mongodb://localhost:27017/");

    let results: any = [];
    // const filePath = 'path/to/your/file.csv';
    const filePath =
        `${__dirname}` + "/../../utils/data/" + "clean_data (1).csv";

    try {
        results = await readCsvFile(filePath);
        // console.log(results);
    } catch (error) {
        // Handle errors here
        return;
    }
    console.log("start");
    const x = async () => {
        for (let i = 0; i < results.length; i++) {
            const entry = results[i];
            const name = entry["Employee Name"];
            const email = name.replace(/\s/g, "") + "@gmail.com";

            const exist = await AllowedUserModel.findOneAndUpdate(
                { email: email, isAdmin: false },
                { email: email, isAdmin: false },
                {
                    upsert: true,
                    new: true,
                }
            );
            const user = await UserModel.findOneAndUpdate(
                { name: name },
                {
                    name: name,
                    email: email,
                    gender: entry["Gender"],
                    age: parseInt(entry["Age"]),
                    isMarried: entry["Married"] == "Married",
                    role: entry["Role"],
                    salary: parseInt(entry["Salary"].replace(",", "")),
                    position: entry["Position"],
                    absences: entry["Absences"],
                    completedProjects: parseInt(entry["Projects_Completed"]),
                    meanMonthlyHours: parseInt(entry["Mean Monthly Hours"]),
                    joiningDate: new Date(
                        parseInt(entry["Joining_Year"]),
                        Math.floor(Math.random() * 12),
                        1 + Math.floor(Math.random() * 25)
                    ),
                    currentRating: parseInt(entry["Current_Employ_Rating"]),
                    moral: entry["Moral"],
                    stressBurnoutScore: entry["Stress & Burnout Score"],
                    projectsOngoing: entry["Ongoing_Project_Count"],
                    projectsWithinDeadline: entry["Projects_Within_Deadline"],
                },
                {
                    upsert: true,
                    new: true,
                }
            );
        }
    };
    await x();
};

// updateDbUser();

const updateDbSubTask = async () => {
    await connectDatabase(config.db, "mongodb://localhost:27017/");

    let results: any = [];
    // const filePath = 'path/to/your/file.csv';
    const filePath =
        `${__dirname}` + "/../../utils/data/" + "clean_data (1).csv";

    try {
        results = await readCsvFile(filePath);
        // console.log(results);
    } catch (error) {
        // Handle errors here
        return;
    }
    console.log("start");

    const x = async () => {
        for (let i = 0; i < results.length; i++) {
            const entry = results[i];
            const name = entry["Employee Name"];
            const email = name.replace(/\s/g, "");

            const user = await UserModel.findOne({ name: name });
            if (!user) {
                console.log("err");
                continue;
            }
            let newStartDate, newDeadline;
            try {
                const startDate = entry["Project_Start_Date"];
                const splitted = startDate.split("/");
                newStartDate =
                    splitted[1] + "/" + splitted[0] + "/" + splitted[2];

                const deadline = entry["Project_Deadline"];
                const splitted2 = deadline.split("/");
                newDeadline =
                    splitted2[1] + "/" + splitted2[0] + "/" + splitted2[2];

                const subTask = await SubtaskModel.create({
                    name: "Subtask " + (i + 1),
                    startDate: new Date(newStartDate),
                    description: entry["Project_Description"],
                    priority:
                        entry["Project_Difficulty"] == "Low"
                            ? 0
                            : entry["Project_Difficulty"] == "Medium"
                              ? 1
                              : 2,
                    deadline: new Date(newDeadline),
                    allotedUsers: user._id,
                });
                await subTask.save();
                await UserModel.findByIdAndUpdate(user._id, {
                    $addToSet: { allotedTasks: subTask._id },
                });
            } catch {
                console.log(entry["Project_Description"]);
                continue;
            }
        }
    };
    await x();
    console.log("done");
};
// updateDbSubTask()

const updateDbSubTask2 = async () => {
    await connectDatabase(config.db, "mongodb://localhost:27017/");

    const user = await UserModel.findOne({ name: "Jacob Rodriguez" });
    if (!user) {
        console.log("err");
        return;
    }
    let newStartDate, newDeadline;
    try {
        const subTask = await SubtaskModel.create({
            name: "Subtask " + 600,
            startDate: new Date("08/24/2023"),
            description: "Develop a secure user registration and login system",
            priority: 2,
            deadline: new Date("9/11/22"),
            allotedUsers: user._id,
        });
        await subTask.save();
        await UserModel.findByIdAndUpdate(user._id, {
            $addToSet: { allotedTasks: subTask._id },
        });
    } catch {
        console.log("Error");
        return;
    }
    console.log("done");
};
// updateDbSubTask2();

const updateDbSubTask3 = async () => {
    await connectDatabase(config.db, "mongodb://localhost:27017/");
    const tasks = await TaskModel.find();
    const allSubTasks = await SubtaskModel.find();
    const data = await Promise.all(
        allSubTasks.map(async (entry, i) => {
            const updatedTask = await TaskModel.findByIdAndUpdate(
                tasks[Math.floor(Math.random() * tasks.length)]._id,
                { $addToSet: { childTasks: entry._id } }
            );
            return 1;
        })
    );
    console.log("done", data.length, allSubTasks.length);
};
// updateDbSubTask3()
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
    const today = new Date();
    const randomDates = [];

    for (let i = 0; i < 10; i++) {
        const randomDay = Math.floor(Math.random() * 21) + 10; // Random number between 10 and 30
        const randomDate = new Date(today);
        randomDate.setDate(today.getDate() + randomDay);
        randomDates.push(new Date(randomDate));
    }
    const data = await Promise.all(
        randomDates.map(async (entry, i) => {
            const randomStatus = Math.floor(Math.random() * 3);
            const newEntry = await ProjectModel.create({
                deadline: entry,
                name: "Project " + i,
                priority: Math.floor(Math.random() * 3),
                description: "This is the description of the project",
                status:
                    randomStatus == 0
                        ? statusMap.COMPLETE
                        : randomStatus == 1
                          ? statusMap.TODO
                          : statusMap.PROGRESS,
            });
            await newEntry.save();

            return newEntry;
        })
    );
    const task = await TaskModel.find();
    const pro = await ProjectModel.find();
    const a = await Promise.all(
        task.map(async (x, i) => {
            const updatedProject = await ProjectModel.findByIdAndUpdate(
                pro[Math.floor(Math.random() * pro.length)]._id,
                { $addToSet: { childTasks: x._id } }
            );
            // return newEntry;
        })
    );
    console.log(data, data.length);
    return;
};

seeder();

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
    const today = new Date();
    const randomDates = [];

    for (let i = 0; i < 20; i++) {
        const randomDay = Math.floor(Math.random() * 21) + 10; // Random number between 10 and 30
        const randomDate = new Date(today);
        randomDate.setDate(today.getDate() + randomDay);
        randomDates.push(new Date(randomDate));
    }
    const data = await Promise.all(
        randomDates.map(async (entry, i) => {
            const randomStatus = Math.floor(Math.random() * 3);
            const newEntry = await TaskModel.create({
                deadline: entry,
                name: "Task " + i,
                priority: Math.floor(Math.random() * 3),
                description: "This is the description of the task",
                status:
                    randomStatus == 0
                        ? statusMap.COMPLETE
                        : randomStatus == 1
                          ? statusMap.TODO
                          : statusMap.PROGRESS,
            });
            await newEntry.save();
            const updatedProject = await ProjectModel.findByIdAndUpdate(
                projects[Math.floor(Math.random() * projects.length)]._id,
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

const seeder4 = async () => {
    connectDatabase(config.db, "mongodb://localhost:27017/");
    const user = await UserModel.findOne();
    if (!user) {
        console.error("No user");
        return;
    }

    const allSubtask = await SubtaskModel.find();
    const n = allSubtask.length;
    let count = 0;
    await Promise.all(
        allSubtask.map(async (subTask) => {
            if (Math.floor(Math.random() * n) <= n / 2) {
                await UserModel.findOneAndUpdate(
                    { email: user.email },
                    { $push: { allotedTasks: subTask._id } }
                );
                await SubtaskModel.findByIdAndUpdate(subTask._id, {
                    $set: { allotedUsers: user._id },
                });
                ++count;
            }
        })
    );
    console.log(count);
};

// seeder4();
// seeder3();
