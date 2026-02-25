import { Router } from "@wxn0brp/falcon-frame";
import { authMiddleware, loginFunction } from "../auth/auth";
import { dataCenter } from "../init/initDataBases";

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
    const dbsKeys = Object.keys(dataCenter);
    res.json({ err: false, result: dbsKeys });
});

onceRouter.post("/auth-check", authMiddleware, (req, res) => {
    res.json({ err: false });
});

export default onceRouter;
