import { authMiddleware, loginFunction } from "../auth/auth";
import express from "express";

const onceRouter = express.Router();

onceRouter.post("/login", async (req, res) => {
    const { login, password } = req.body;
    if(!login || !password) return res.json({ err: true, msg: "Login and password are required" });
    
    const { err, token } = await loginFunction(login, password);
    if(err) return res.json({ err: true, msg: "Invalid login or password." });
    res.json({ err: false, token });
});

onceRouter.post("/getDbList", authMiddleware, async (req, res) => {
    const dbsKeys = Object.keys(global.dataCenter);
    const dbs = dbsKeys.map(dbName => ({ name: dbName, type: global.dataCenter[dbName].type }));
    res.json({ err: false, result: dbs });
});

onceRouter.post("/auth-check", authMiddleware, (req, res) => {
    res.json({ err: false });
});

export default onceRouter;