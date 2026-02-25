import { Router } from "@wxn0brp/falcon-frame";
import { dbLogic } from "./logic";

const router = new Router();

router.post("/:type", async (req, res) => {
    const result = await dbLogic({
        type: req.params.type,
        dbName: req.body.db,
        userId: req.user._id,
        query: req.body.params[0],
        keys: req.body.keys || []
    });

    result.ff(res);
});

router.post("/:db/:type", async (req, res) => {
    const collection = req.query?.c || "";
    const params = req.body?.params || {};

    const result = await dbLogic({
        type: req.params.type,
        dbName: req.params.db,
        userId: req.user._id,
        query: {
            collection,
            ...params
        },
        keys: req.body.keys || []
    });

    result.ff(res);
});

export default router;
