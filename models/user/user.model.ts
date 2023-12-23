import { Schema, model, Document, Types } from "mongoose";

interface UserInterface extends Document {
    name: string;
    email: string;
    allotedTasks: Array<Types.ObjectId>;
    image: string;
    gender: string;
    age: number;
    isMarried: boolean;
    role: string;
    salary: number;
    position: string;
    absences: number;
    meanMonthlyHours: number;
    joiningDate: Date;
    currentRating: number; // 0-10 (given by admin)
    moral: string; // given by admin
    stressBurnoutScore: number; // ML model
}

const genderMap = {
    MALE: "Male",
    FEMALE: "Female",
};

/*
[
    'Employee Name', 'ID', 'Gender', 'Age', 'Married', 'Role', 'Salary', 'Position', 
    'Absences', 'Projects_Completed', 'Mean Monthly Hours', 'Years in the company', 
    'Joining_Date', 'Current_Employ_Rating', 'Moral', 'Stress & Burnout Score', 
    'Ongoing_Project_Count', 'Within_Deadline', 'Project_Description', 
    'Project_Difficulty', 'Project_Deadline', 'Text_Feedback_Each_Manager'
]


*/
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
    gender: {
        type: String,
        default: "Male",
    },
    age: {
        type: Number,
        default: 0,
    },
    isMarried: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        default: "HR",
    },
    salary: {
        type: Number,
        default: 0,
    },
    position: {
        type: String,
        default: "Intern",
    },
    absences: {
        type: Number,
        default: 0,
    },
    meanMonthlyHours: {
        type: Number,
        default: 0,
    },
    joiningDate: {
        type: Date,
        default: null,
    },
    currentRating: {
        type: Number,
        default: 0,
    }, // 0-10 (given by admin)
    moral: {
        type: String,
        default: "",
    }, // 0-5 (given by admin)
    stressBurnoutScore: {
        type: Number,
        default: 0,
    }, // ML model
});

const UserModel = model<UserInterface>("UserModel", UserSchema);

export default UserModel;
