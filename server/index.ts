import express from "express";
import bodyParser from "body-parser";
import { authMiddleware, loginFunction } from "./auth";
import dbRouter from "./db";
import "./initDataBases";
import cors from "cors";
import { configDotenv } from "dotenv";

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

function checkRequest(req, res, next){
    const dbName = req.body.db;

    if(!global.dataCenter[dbName]){
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    req.dataCenter = global.dataCenter[dbName].db;
    req.dbType = global.dataCenter[dbName].type;

    next();
}

const apiDbRouter = express.Router();
apiDbRouter.use(authMiddleware);
apiDbRouter.use(checkRequest);
apiDbRouter.use(dbRouter);

app.use("/db/", apiDbRouter);
app.post("/login", async (req, res) => {
    const { login, password } = req.body;
    if(!login || !password) return res.json({ err: true, msg: "Login and password are required" });
    
    const { err, token } = await loginFunction(login, password);
    if(err) return res.json({ err: true, msg: "Invalid login or password." });
    res.json({ err: false, token });
});

app.post("/getDbList", authMiddleware, async (req, res) => {
    const dbsKeys = Object.keys(global.dataCenter);
    const dbs = dbsKeys.map(dbName => ({ name: dbName, type: global.dataCenter[dbName].type }));
    res.json({ err: false, result: dbs });
});

app.post("/auth-check", authMiddleware, (req, res) => {
    res.json({ err: false });
});

if(process.env.gui){
    app.use("/gui", express.static("gui"));
}

app.listen(port, () => console.log(`Server started on port ${port}`));