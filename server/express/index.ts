import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import apiRouter  from "./db";
import onceRouter from "./once";

const app = express();
app.get("/", (req, res) => res.send("Server is running."));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: "*",
}));
app.use("/", onceRouter);

if (process.env.gui) {
    const gui = await import("./gui");
    app.use("/gui", gui.default);
}

app.use("/", apiRouter);

const port = process.env.PORT || 14785;
app.listen(port, () => console.log(`Server started on port ${port}`));