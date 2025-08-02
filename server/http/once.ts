import { Router } from "@wxn0brp/falcon-frame";
import { authMiddleware, loginFunction } from "../auth/auth";

const onceRouter = new Router();

onceRouter.post("/login", async (req, res) => {
    const { login, password, time } = req.body;
    if (!login || !password) return res.json({ err: true, msg: "Login and password are required" });

    if (
        time !== undefined && (
            typeof time !== "string" &&
            time !== "true" &&
            time !== "false" &&
            !isNaN(parseInt(time))
        )
    )
        return res.json({ err: true, msg: "Invalid time." })

    const access = await loginFunction(login, password);
    if (access.err == true) return res.json(access);

    res.json({ err: false, token: access.token });
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