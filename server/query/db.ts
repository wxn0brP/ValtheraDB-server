import { Router } from "@wxn0brp/falcon-frame";
import { dbLogic } from "./db.logic";

const router = new Router();

router.post("/:type", async (req, res) => {
    const result = await dbLogic({
        type: req.params.type,
        dbName: req.body.db,
        userId: req.user._id,
        params: req.body.params,
        keys: req.body.keys || []
    });

    result.ff(res);
});

router.post("/:db/:type", async (req, res) => {
    const collection = req.query?.c || "";

    const result = await dbLogic({
        type: req.params.type,
        dbName: req.params.db,
        userId: req.user._id,
        params: [collection, ...(req.body?.params || [])],
        keys: req.body.keys || []
    });

    result.ff(res);
});

export default router;