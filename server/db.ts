import { Router } from "express";
import deserializeFunctions from "./function";
import { isPathSafe } from "./pathUtils";
const router = Router();

router.post('/:type', async (req, res) => {
    const { type } = req.params as { type: string };

    if (!type) {
        return res.status(400).json({ err: true, msg: "type is required" });
    }

    try {
        const db = req.dataCenter;
        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.json({ err: false, result: collections });
        }

        if(!db[type] || typeof db[type] !== "function"){
            return res.status(400).json({ err: true, msg: "invalid type" });
        }

        const params = req.body.params as (Object | string)[];
        if (!params || params.length === 0) return res.status(400).json({ err: true, msg: "params is required" });

        const keys = req.body.keys as string[];
        const parsedParams = deserializeFunctions(params, keys);

        const collection = params.shift() as string;
        if (!collection) {
            return res.status(400).json({ err: true, msg: "collection is required" });
        }
        if (!isPathSafe(global.baseDir, collection)) {
            return res.status(400).json({ err: true, msg: "invalid collection" });
        }

        const result = await db[type](collection, ...parsedParams as any[]);

        res.json({ err: false, result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: true, msg: err.message });
    }
});

export default router;