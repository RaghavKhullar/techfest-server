import express from "express";
import dotenv from "dotenv";
dotenv.config({
    path: __dirname.replace("build", ".env"),
});
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDatabase from "./utils/connectDatabase";
import config from "./config/config";
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import adminRouter from "./routes/admin.routes";
import fs from "fs";

connectDatabase(config.db);
const app = express();

// Neccessary Middlewares
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(
    cors({
        origin: ["http://localhost:3000", process.env.FRONTEND_URL as string],
        credentials: true,
    })
);

// Sending documents stored in server
app.get("/documents/files/*", (req: any, res: any) => {
    try {
        if (fs.existsSync("./storage/documents/" + req.params["0"])) {
            return res.sendFile("storage/documents/" + req.params["0"], {
                root: __dirname + "/../",
            });
        } else {
            return res.sendFile("storage/dummy.pdf", {
                root: __dirname + "/../",
            });
        }
    } catch (e) {
        console.error(e);
        return res
            .status(500)
            .send({ message: "Error while fetching the pdf" });
    }
});

// Sending profiles stored in server
app.get("/images/profiles/*", (req: any, res: any) => {
    try {
        if (fs.existsSync("./storage/images/" + req.params["0"])) {
            return res.sendFile("storage/images/" + req.params["0"], {
                root: __dirname + "/../",
            });
        } else {
            return res.sendFile("storage/dummyProfile.png", {
                root: __dirname + "/../",
            });
        }
    } catch (e) {
        console.error(e);
        return res
            .status(500)
            .send({ message: "Error while fetching the image" });
    }
});

app.use(express.json());
app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms")
);
app.use(cookieParser());
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
