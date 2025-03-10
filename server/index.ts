import bodyParser from "body-parser";
import cors from "cors";
import { configDotenv } from "dotenv";
import express from "express";
import { apiDbRouter, queryApiRouter } from "./express/db";
import "./initDataBases";
import onceRouter from "./express/once";

configDotenv();
const port = process.env.PORT || 14785;
global.baseDir = process.env.BASE_DIR || process.cwd();

console.log("baseDir", global.baseDir);
const app = express();
app.get("/", (req, res) => res.send("Server is running."));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: "*",
}));
app.use("/db/", apiDbRouter);
app.use("/q/", queryApiRouter);
app.use("/", onceRouter);


if (process.env.gui) {
    const gui = await import("./express/gui");
    app.use("/gui", gui.default);
}

app.listen(port, () => console.log(`Server started on port ${port}`));