import express from "express";
import dotenv from "dotenv";
dotenv.config({
    path: __dirname.replace("build", ".env"),
});
import connectDatabase from "./utils/connectDatabase";
import config from "./config/config";
import morgan from "morgan";
connectDatabase(config.db);
const app = express();

app.use(express.json());
app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms")
);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
